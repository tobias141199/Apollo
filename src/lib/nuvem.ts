// Conta do usuário e sincronização do progresso com o servidor (/api).
//
// O site só abre com login (o servidor bloqueia o resto; a página de login é src/entrar/main.tsx).
// O progresso continua salvo no navegador (IndexedDB + localStorage), então o site funciona mesmo
// sem internet. Com a conta aberta, o que muda localmente fica marcado como "pendente"
// e é enviado ao servidor; e o que mudou no servidor (em outro aparelho) é baixado.
import { useSyncExternalStore } from 'react'
import { definirCatalogo } from '../content'
import { db, type Cartao } from './db'

export interface Usuario { id: number; email: string; nome: string | null; admin: boolean }

/** Preferências do localStorage que acompanham a conta. */
export const PREFS_SINC = ['ag:estudadas', 'ag:selecao', 'ag:selecao-athenaze', 'ag:aprender']

// ---- estado da conta (lido pelos componentes com useConta) ----
let estado: { usuario: Usuario | null; google: boolean; servidor: boolean } = { usuario: null, google: false, servidor: false }
const ouvintes = new Set<() => void>()
const mudar = (novo: Partial<typeof estado>) => { estado = { ...estado, ...novo }; ouvintes.forEach(f => f()) }
export const useConta = () => useSyncExternalStore(f => { ouvintes.add(f); return () => { ouvintes.delete(f) } }, () => estado)

// ---- pendências: o que mudou aqui e ainda não foi para o servidor ----
interface Pendentes { cartoes: string[]; respostas: string[]; prefs: string[] }
const lerLS = <T,>(k: string, p: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : p } catch { return p } }
const gravarLS = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignora */ } }
const lerPendentes = () => lerLS<Pendentes>('ag:pendentes', { cartoes: [], respostas: [], prefs: [] })

export function marcar(tipo: keyof Pendentes, id: string) {
  const p = lerPendentes()
  if (!p[tipo].includes(id)) { p[tipo].push(id); gravarLS('ag:pendentes', p) }
  if (estado.usuario) agendar()
}

let timer: ReturnType<typeof setTimeout> | undefined
function agendar() { clearTimeout(timer); timer = setTimeout(() => { sincronizar().catch(() => {}) }, 2500) }

const api = (caminho: string, init?: RequestInit) =>
  fetch(`/api${caminho}`, { credentials: 'same-origin', ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })

async function enviar(keepalive = false) {
  const p = lerPendentes()
  if (!p.cartoes.length && !p.respostas.length && !p.prefs.length) return
  const cartoes = (await db.cartoes.bulkGet(p.cartoes)).filter(Boolean)
  const respostas = await Promise.all(p.respostas.map(ex => db.respostas.where('exercicio').equals(ex).last()))
  const preferencias = Object.fromEntries(p.prefs.map(k => [k, lerLS(k, null)]))
  const r = await api('/progresso', {
    method: 'POST', keepalive,
    body: JSON.stringify({ cartoes, respostas: respostas.filter(Boolean).map(r => ({ exercicio: r!.exercicio, texto: r!.texto, em: r!.em })), preferencias }),
  })
  if (!r.ok) throw new Error(await r.text())
  // Tira das pendências só o que foi enviado (algo pode ter mudado enquanto isso).
  const agora = lerPendentes()
  gravarLS('ag:pendentes', {
    cartoes: agora.cartoes.filter(x => !p.cartoes.includes(x)),
    respostas: agora.respostas.filter(x => !p.respostas.includes(x)),
    prefs: agora.prefs.filter(x => !p.prefs.includes(x)),
  })
}

const reviverDatas = (c: Cartao): Cartao => ({
  ...c, card: { ...c.card, due: new Date(c.card.due), last_review: c.card.last_review ? new Date(c.card.last_review) : undefined },
})

async function receber() {
  const desde = lerLS<string>('ag:sinc-desde', '1970-01-01T00:00:00Z')
  const r = await api(`/progresso?desde=${encodeURIComponent(desde)}`)
  if (!r.ok) throw new Error(await r.text())
  const d = await r.json() as { agora: string; cartoes: Cartao[]; respostas: { exercicio: string; texto: string; em: string }[]; preferencias: Record<string, unknown> }
  const pend = lerPendentes()
  // O que tem mudança local ainda não enviada não é sobrescrito.
  await db.cartoes.bulkPut(d.cartoes.filter(c => !pend.cartoes.includes(c.id)).map(reviverDatas))
  for (const resp of d.respostas) {
    if (pend.respostas.includes(resp.exercicio)) continue
    const ultima = await db.respostas.where('exercicio').equals(resp.exercicio).last()
    if (ultima?.texto !== resp.texto) await db.respostas.add({ exercicio: resp.exercicio, texto: resp.texto, em: new Date(resp.em) })
  }
  for (const [k, v] of Object.entries(d.preferencias)) if (!pend.prefs.includes(k)) gravarLS(k, v)
  gravarLS('ag:sinc-desde', d.agora)
  return d.cartoes.length + d.respostas.length + Object.keys(d.preferencias).length
}

let emCurso: Promise<number> | null = null
/** Envia o que está pendente e baixa o que mudou. Devolve quantos registros vieram do servidor. */
export function sincronizar(): Promise<number> {
  if (!estado.usuario) return Promise.resolve(0)
  emCurso ??= (async () => { await enviar(); return receber() })().finally(() => { emCurso = null })
  return emCurso
}

/** Na abertura do site: quem está logado, catálogo de imagens e primeira sincronização. */
export async function iniciar() {
  const comPrazo = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, n) => setTimeout(() => n(new Error('prazo')), ms))])
  try {
    const r = await comPrazo(api('/auth/eu'), 4000)
    if (!r.ok) return // sem servidor (ex.: npm run dev sem o servidor): tudo fica só no navegador
    const { usuario, google } = await r.json() as { usuario: Usuario | null; google: boolean }
    // Sem login, sem acesso: o servidor só entrega o site a quem entrou; se a sessão acabou, volta ao login.
    if (!usuario) { location.replace('/entrar.html'); await new Promise(() => {}) }
    mudar({ usuario, google, servidor: true })
    const cat = await comPrazo(api('/imagens'), 4000).then(r => r.ok ? r.json() : null).catch(() => null)
    if (cat) definirCatalogo(cat, '/api/imagens/')
    const conta = lerLS<number | null>('ag:conta', null)
    if (usuario && conta !== usuario.id) {
      // Outra conta usou este navegador antes: o progresso local era dela, não desta.
      if (conta != null) await limparLocal()
      gravarLS('ag:conta', usuario.id)
    }
    if (usuario) await comPrazo(sincronizar(), 8000).catch(() => {})
  } catch { /* offline: segue com o que está no navegador */ }
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && estado.usuario) enviar(true).catch(() => {}) })
  setInterval(() => { if (estado.usuario) sincronizar().catch(() => {}) }, 5 * 60000)
}

async function limparLocal() {
  await Promise.all([db.cartoes.clear(), db.respostas.clear()])
  for (const k of [...PREFS_SINC, 'ag:pendentes', 'ag:sinc-desde', 'ag:conta']) localStorage.removeItem(k)
}

/** Marca todo o progresso local como pendente (ex.: depois de restaurar um backup). */
export async function marcarTudo() {
  const [ids, resp] = await Promise.all([db.cartoes.toCollection().primaryKeys(), db.respostas.toArray()])
  gravarLS('ag:pendentes', {
    cartoes: ids, respostas: [...new Set(resp.map(r => r.exercicio))],
    prefs: PREFS_SINC.filter(k => localStorage.getItem(k) != null),
  })
  if (estado.usuario) agendar()
}

export async function sair() {
  await enviar().catch(() => {})
  await api('/auth/sair', { method: 'POST', body: '{}' })
  await limparLocal()
  location.replace('/entrar.html')
}

/** "Apagar progresso" também apaga no servidor. */
export async function apagarProgressoNaConta() {
  if (!estado.usuario) return
  const r = await api('/progresso', { method: 'DELETE' })
  if (!r.ok) throw new Error(await r.text())
  gravarLS('ag:pendentes', { ...lerPendentes(), cartoes: [], respostas: [] })
}

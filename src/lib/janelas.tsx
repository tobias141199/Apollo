// Janelas flutuantes de tabelas: ficam abertas enquanto o aluno navega pelo app
// e são salvas no localStorage (sobrevivem a recarregar a página).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { paradigmaPorId } from '../content'
import { gravar, ler } from './selecao'

export const MAX_TABELAS = 5
const CHAVE = 'ag:janelas'

export interface Janela {
  id: string
  tabelas: string[]
  x: number
  y: number
  w: number
  h: number
  minimizada: boolean
  /** Ordem de empilhamento: a maior fica na frente. */
  z: number
}

interface Ctx {
  janelas: Janela[]
  /** Abre uma janela nova com estas tabelas (no máximo 5). */
  abrir: (tabelas: string[], perto?: { x: number; y: number }) => void
  /** Acrescenta uma tabela à janela da frente; se não houver ou estiver cheia, abre outra. */
  acrescentar: (tabela: string) => void
  atualizar: (id: string, patch: Partial<Janela>) => void
  fechar: (id: string) => void
  trazer: (id: string) => void
  /** Move uma tabela de uma janela para outra (ou de fora do sistema de janelas, se `de` for null). */
  moverTabela: (tabela: string, de: string | null, para: string) => void
  /** Tira uma tabela da janela e a põe numa janela própria. */
  destacar: (tabela: string, de: string, perto?: { x: number; y: number }) => void
  minimizarTodas: (min: boolean) => void
}
const JanelasCtx = createContext<Ctx | null>(null)

const largura = (n: number) => Math.min(window.innerWidth - 16, 40 + n * 300)
const novaId = () => Math.random().toString(36).slice(2, 9)

function validas(js: Janela[]): Janela[] {
  return js
    .map(j => ({ ...j, tabelas: j.tabelas.filter(t => paradigmaPorId.has(t)).slice(0, MAX_TABELAS) }))
    .filter(j => j.tabelas.length > 0)
}

export function JanelasProvider({ children }: { children: ReactNode }) {
  const [janelas, setJanelas] = useState<Janela[]>(() => validas(ler(CHAVE, [])))
  useEffect(() => gravar(CHAVE, janelas), [janelas])

  const topo = (js: Janela[]) => js.reduce((m, j) => Math.max(m, j.z), 0) + 1
  const criar = useCallback((js: Janela[], tabelas: string[], perto?: { x: number; y: number }): Janela[] => {
    const t = [...new Set(tabelas)].slice(0, MAX_TABELAS)
    const w = largura(t.length), h = Math.min(window.innerHeight - 80, 420)
    const desloc = (js.length % 6) * 28
    const x = perto ? perto.x - 40 : window.innerWidth - w - 24 - desloc
    const y = perto ? perto.y - 16 : 80 + desloc
    return [...js, { id: novaId(), tabelas: t, w, h, x, y, minimizada: false, z: topo(js) }]
  }, [])

  const valor = useMemo<Ctx>(() => ({
    janelas,
    abrir: (tabelas, perto) => setJanelas(js => criar(js, tabelas, perto)),
    acrescentar: tabela => setJanelas(js => {
      const frente = [...js].filter(j => !j.minimizada).sort((a, b) => b.z - a.z)[0]
      if (!frente || frente.tabelas.length >= MAX_TABELAS) return criar(js, [tabela])
      if (frente.tabelas.includes(tabela)) return js
      return js.map(j => j.id === frente.id
        ? { ...j, tabelas: [...j.tabelas, tabela], w: Math.max(j.w, largura(j.tabelas.length + 1)) } : j)
    }),
    atualizar: (id, patch) => setJanelas(js => js.map(j => j.id === id ? { ...j, ...patch } : j)),
    fechar: id => setJanelas(js => js.filter(j => j.id !== id)),
    trazer: id => setJanelas(js => {
      const alvo = js.find(j => j.id === id)
      if (!alvo || (alvo.z === topo(js) - 1 && !alvo.minimizada)) return js // já está na frente
      return js.map(j => j.id === id ? { ...j, z: topo(js), minimizada: false } : j)
    }),
    moverTabela: (tabela, de, para) => setJanelas(js => {
      const alvo = js.find(j => j.id === para)
      if (!alvo || de === para || alvo.tabelas.includes(tabela) || alvo.tabelas.length >= MAX_TABELAS) return js
      return js
        .map(j => j.id === para ? { ...j, tabelas: [...j.tabelas, tabela], w: Math.max(j.w, largura(j.tabelas.length + 1)), z: topo(js) }
          : j.id === de ? { ...j, tabelas: j.tabelas.filter(t => t !== tabela) } : j)
        .filter(j => j.tabelas.length > 0)
    }),
    destacar: (tabela, de, perto) => setJanelas(js => {
      const origem = js.find(j => j.id === de)
      if (!origem || origem.tabelas.length < 2) return js
      return criar(js.map(j => j.id === de ? { ...j, tabelas: j.tabelas.filter(t => t !== tabela) } : j), [tabela], perto)
    }),
    minimizarTodas: min => setJanelas(js => js.map(j => ({ ...j, minimizada: min }))),
  }), [janelas, criar])
  return <JanelasCtx.Provider value={valor}>{children}</JanelasCtx.Provider>
}

export function useJanelas() {
  const c = useContext(JanelasCtx)
  if (!c) throw new Error('useJanelas fora do provider')
  return c
}

/** Abre as tabelas numa janela de verdade do navegador (pode ir para outro monitor). */
export function abrirJanelaPropria(tabelas: string[]) {
  const t = tabelas.slice(0, MAX_TABELAS)
  const url = `${location.origin}${location.pathname}#/janela?t=${t.join(',')}`
  const w = Math.min(screen.availWidth, 60 + t.length * 320), h = Math.min(screen.availHeight, 560)
  window.open(url, `tabelas-${t.join('-')}`, `popup,width=${w},height=${h}`)
}

/** Formato usado ao arrastar uma tabela (HTML drag and drop). */
export const TIPO_ARRASTE = 'application/x-ag-tabela'
export interface Arraste { tabela: string; de: string | null }

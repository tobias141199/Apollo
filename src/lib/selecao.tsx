// Quais lições (seções da JACT, como 1A, e capítulos do Athenaze, como ath1) o aluno está estudando.
// Fica no localStorage do navegador.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { licoes, vocabulario, type Entrada } from '../content'
import { marcar, PREFS_SINC } from './nuvem'

const CHAVE = 'ag:selecao'
/** Marca que a seleção salva já conhece os capítulos do Athenaze (as antigas só tinham seções da JACT). */
const CHAVE_ATH = 'ag:selecao-athenaze'
const todas = () => licoes.filter(l => !l.emPreparacao).map(l => l.id)

interface Ctx {
  selecionadas: Set<string>
  alternar: (id: string) => void
  definir: (ids: string[]) => void
  /** Vocabulário das lições selecionadas. */
  vocab: Entrada[]
  apenasAprender: boolean
  setApenasAprender: (v: boolean) => void
}
const SelecaoCtx = createContext<Ctx | null>(null)

export function ler<T>(k: string, padrao: T): T {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao } catch { return padrao }
}
export function gravar(k: string, v: unknown) {
  try {
    const novo = JSON.stringify(v)
    if (localStorage.getItem(k) === novo) return
    localStorage.setItem(k, novo)
    if (PREFS_SINC.includes(k)) marcar('prefs', k) // acompanha a conta (ver nuvem.ts)
  } catch { /* ignora */ }
}

function lerSelecao(): string[] {
  const salva = ler<string[] | null>(CHAVE, null)
  if (!salva) return todas()
  if (ler(CHAVE_ATH, false)) return salva
  // Seleção antiga (só JACT): acrescenta os capítulos do Athenaze que correspondem às seções escolhidas.
  const extras = licoes.filter(l => l.livro === 'Athenaze' && !l.emPreparacao
    && (l.ponte?.correspondentes.some(id => salva.includes(id)) ?? true)).map(l => l.id)
  return [...new Set([...salva, ...extras])]
}

export function SelecaoProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(lerSelecao)
  const [apenasAprender, setApenasAprender] = useState<boolean>(() => ler('ag:aprender', true))
  useEffect(() => { gravar(CHAVE, ids); gravar(CHAVE_ATH, true) }, [ids])
  useEffect(() => gravar('ag:aprender', apenasAprender), [apenasAprender])

  const valor = useMemo<Ctx>(() => {
    const selecionadas = new Set(ids)
    return {
      selecionadas,
      alternar: id => setIds(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]),
      definir: setIds,
      vocab: vocabulario.filter(v => v.origens.some(o => selecionadas.has(o.licaoId) && (!apenasAprender || o.aprender))),
      apenasAprender, setApenasAprender,
    }
  }, [ids, apenasAprender])
  return <SelecaoCtx.Provider value={valor}>{children}</SelecaoCtx.Provider>
}

export function useSelecao() {
  const c = useContext(SelecaoCtx)
  if (!c) throw new Error('useSelecao fora do provider')
  return c
}

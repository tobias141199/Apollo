import { vocabulario, type Entrada } from '../content'
import { betaParaGrego, chave, ehGrego } from './greek'

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Busca por grego (ou beta code) e por glosa em português. Prefixo do lema vem primeiro. */
export function buscar(q: string, limite = 30): Entrada[] {
  q = q.trim()
  if (!q) return []
  const latino = !ehGrego(q)
  const kGr = chave(latino ? betaParaGrego(q) : q)
  const kPt = semAcento(q)
  const pontos = (e: Entrada) => {
    if (kGr && e.chave === kGr) return 0
    if (kGr && e.chave.startsWith(kGr)) return 1
    if (latino && semAcento(e.glosa).split(/[;,]\s*/).some(g => g.replace(/^(o|a|os|as) /, '') === kPt)) return 2
    if (kGr && e.chave.includes(kGr)) return 3
    if (latino && semAcento(e.glosa).includes(kPt)) return 4
    return 99
  }
  return vocabulario.map(e => [pontos(e), e] as const).filter(([p]) => p < 99)
    .sort((a, b) => a[0] - b[0] || a[1].chave.localeCompare(b[1].chave)).slice(0, limite).map(([, e]) => e)
}

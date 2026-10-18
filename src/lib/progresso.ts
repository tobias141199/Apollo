// Avaliações das lições e desbloqueio da trilha.
//
// Cada lição termina com uma avaliação; com NOTA_MINIMA (70%) ou mais ela fica aprovada e a
// próxima lição da trilha é liberada. As lições à frente podem ser abertas e lidas ("espiada"),
// mas a avaliação delas só abre quando todas as anteriores estiverem aprovadas.
//
// Guardado no localStorage e sincronizado com a conta (ver PREFS_SINC em nuvem.ts):
//   ag:estudadas  → ids das lições aprovadas (o nome antigo ficou; lições marcadas antes contam como aprovadas)
//   ag:avaliacoes → melhor nota, última nota e número de tentativas de cada lição
import { useSyncExternalStore } from 'react'
import { passosTrilha } from '../content'
import { gravar, ler } from './selecao'

export const NOTA_MINIMA = 0.7

export interface Registro { melhor: number; ultima: number; tentativas: number; em: string }
interface Estado { aprovadas: Set<string>; avaliacoes: Record<string, Registro> }

const lerEstado = (): Estado => ({
  aprovadas: new Set(ler<string[]>('ag:estudadas', [])),
  avaliacoes: ler<Record<string, Registro>>('ag:avaliacoes', {}),
})
let estado = lerEstado()
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach(f => f())
// Outra aba (ou a sincronização) mudou o localStorage: relê.
if (typeof addEventListener !== 'undefined') addEventListener('storage', e => {
  if (e.key === 'ag:estudadas' || e.key === 'ag:avaliacoes') { estado = lerEstado(); avisar() }
})

export function useProgresso() {
  return useSyncExternalStore(f => { ouvintes.add(f); return () => { ouvintes.delete(f) } }, () => estado)
}

/** Registra uma tentativa; aprova a lição se a nota for suficiente. */
export function registrarAvaliacao(id: string, nota: number) {
  const ant = estado.avaliacoes[id]
  const avaliacoes = {
    ...estado.avaliacoes,
    [id]: { melhor: Math.max(nota, ant?.melhor ?? 0), ultima: nota, tentativas: (ant?.tentativas ?? 0) + 1, em: new Date().toISOString() },
  }
  const aprovadas = new Set(estado.aprovadas)
  if (nota >= NOTA_MINIMA) aprovadas.add(id)
  estado = { aprovadas, avaliacoes }
  gravar('ag:avaliacoes', avaliacoes)
  gravar('ag:estudadas', [...aprovadas])
  avisar()
}

/** As lições da trilha que têm conteúdo (os capítulos "em preparação" não contam). */
const disponiveis = () => passosTrilha.filter(p => !p.licao.emPreparacao).map(p => p.licao.id)

/** Liberada = todas as lições anteriores da trilha foram aprovadas. Fora da trilha: sempre liberada. */
export function estaLiberada(id: string, e: Estado = estado) {
  const ordem = disponiveis()
  const i = ordem.indexOf(id)
  return i <= 0 || ordem.slice(0, i).every(x => e.aprovadas.has(x))
}

/** A lição que trava a seguinte: a primeira ainda não aprovada antes de `id`. */
export function bloqueadaPor(id: string, e: Estado = estado) {
  const ordem = disponiveis()
  return ordem.slice(0, Math.max(0, ordem.indexOf(id))).find(x => !e.aprovadas.has(x))
}

/** A próxima lição a estudar: a primeira ainda não aprovada. */
export function licaoAtual(e: Estado = estado) {
  return disponiveis().find(x => !e.aprovadas.has(x))
}

// Progresso do aluno, salvo no navegador (IndexedDB). Nada vai para servidor algum.
import Dexie, { type EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type Direcao = 'gp' | 'pg' // grego→português | português→grego

export interface Cartao {
  /** `${direcao}:${chaveDaPalavra}` */
  id: string
  palavra: string
  direcao: Direcao
  card: Card
}

export interface Resposta {
  id?: number
  exercicio: string // `${secao}/${exercicio}/${item}`
  texto: string
  em: Date
}

export interface Ajuste { chave: string; valor: unknown }

export const db = new Dexie('aprendendo-grego') as Dexie & {
  cartoes: EntityTable<Cartao, 'id'>
  respostas: EntityTable<Resposta, 'id'>
  ajustes: EntityTable<Ajuste, 'chave'>
}

db.version(1).stores({
  cartoes: 'id, palavra, direcao, card.due',
  respostas: '++id, exercicio',
  ajustes: 'chave',
})

export async function getAjuste<T>(chave: string, padrao: T): Promise<T> {
  const a = await db.ajustes.get(chave)
  return (a?.valor as T) ?? padrao
}
export const setAjuste = (chave: string, valor: unknown) => db.ajustes.put({ chave, valor })

/** Exporta todo o progresso como JSON (backup). */
export async function exportar(): Promise<string> {
  const [cartoes, respostas, ajustes] = await Promise.all([
    db.cartoes.toArray(), db.respostas.toArray(), db.ajustes.toArray(),
  ])
  return JSON.stringify({ app: 'aprendendo-grego', versao: 1, cartoes, respostas, ajustes }, null, 1)
}

export async function importar(json: string) {
  const d = JSON.parse(json, (k, v) =>
    (k === 'due' || k === 'last_review' || k === 'em') && typeof v === 'string' ? new Date(v) : v)
  if (d.app !== 'aprendendo-grego') throw new Error('Arquivo não é um backup deste app.')
  await db.transaction('rw', db.cartoes, db.respostas, db.ajustes, async () => {
    await Promise.all([db.cartoes.clear(), db.respostas.clear(), db.ajustes.clear()])
    await db.cartoes.bulkPut(d.cartoes ?? [])
    await db.respostas.bulkPut(d.respostas ?? [])
    await db.ajustes.bulkPut(d.ajustes ?? [])
  })
}

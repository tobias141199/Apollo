// Repetição espaçada com FSRS (o algoritmo do Anki moderno).
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs'
import { db, type Cartao, type Direcao } from './db'
import { marcar } from './nuvem'

const agendador = fsrs({ enable_fuzz: true })

export { Rating }
export type Nota = Grade

export const cartaoId = (direcao: Direcao, palavra: string) => `${direcao}:${palavra}`

/** Monta a fila: cartões vencidos primeiro, depois até `novos` palavras nunca vistas. */
export async function montarFila(palavras: string[], direcao: Direcao, novos: number, agora = new Date()) {
  const ids = palavras.map(p => cartaoId(direcao, p))
  const existentes = (await db.cartoes.bulkGet(ids)).filter((c): c is Cartao => !!c)
  const vistos = new Set(existentes.map(c => c.palavra))
  const vencidos = existentes
    .filter(c => new Date(c.card.due) <= agora)
    .sort((a, b) => +new Date(a.card.due) - +new Date(b.card.due))
  const ineditos = palavras.filter(p => !vistos.has(p)).slice(0, novos)
  return {
    fila: [...vencidos.map(c => c.palavra), ...ineditos],
    vencidos: vencidos.length,
    novos: ineditos.length,
    total: palavras.length,
    aprendidos: existentes.length,
  }
}

export async function responder(palavra: string, direcao: Direcao, nota: Nota, agora = new Date()) {
  const id = cartaoId(direcao, palavra)
  const atual: Card = (await db.cartoes.get(id))?.card ?? createEmptyCard<Card>(agora)
  const { card } = agendador.next(atual, agora, nota)
  await db.cartoes.put({ id, palavra, direcao, card })
  marcar('cartoes', id)
  return card
}

/** Texto curto do próximo intervalo de cada botão, como no Anki ("10 min", "3 d"). */
export function previsoes(card: Cartao['card'] | undefined, agora = new Date()) {
  const r = agendador.repeat(card ?? createEmptyCard<Card>(agora), agora)
  const fmt = (d: Date) => {
    const min = Math.round((+d - +agora) / 60000)
    if (min < 60) return `${Math.max(1, min)} min`
    if (min < 1440) return `${Math.round(min / 60)} h`
    const dias = Math.round(min / 1440)
    return dias < 31 ? `${dias} d` : `${Math.round(dias / 30)} m`
  }
  return {
    [Rating.Again]: fmt(r[Rating.Again].card.due),
    [Rating.Hard]: fmt(r[Rating.Hard].card.due),
    [Rating.Good]: fmt(r[Rating.Good].card.due),
    [Rating.Easy]: fmt(r[Rating.Easy].card.due),
  } as Record<Nota, string>
}

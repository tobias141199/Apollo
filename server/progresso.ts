// Progresso de cada usuário: cartões dos flashcards, respostas dos exercícios e preferências
// (lições estudadas, seleção de lições). O navegador envia o que mudou e baixa o que mudou desde
// a última vez (`desde`), então o mesmo progresso aparece em qualquer aparelho.
import { Hono } from 'hono'
import { exigirLogin, type Env } from './auth.ts'
import { pool, q } from './db.ts'

interface Envio {
  cartoes?: { id: string; card: { last_review?: string } }[]
  respostas?: { exercicio: string; texto: string; em: string }[]
  preferencias?: Record<string, unknown>
}

export const progresso = new Hono<Env>()
progresso.use(exigirLogin)

progresso.get('/', async c => {
  const id = c.var.usuario!.id
  const desde = c.req.query('desde') ?? '1970-01-01'
  // O carimbo é tirado antes das consultas: o que mudar durante elas vem de novo na próxima vez.
  const [{ agora }] = await q<{ agora: string }>('select now() as agora')
  const [cartoes, respostas, prefs] = await Promise.all([
    q<{ dados: unknown }>('select dados from cartoes where usuario_id = $1 and atualizado_em > $2', [id, desde]),
    q('select exercicio, texto, em from respostas where usuario_id = $1 and atualizado_em > $2', [id, desde]),
    q<{ chave: string; valor: unknown }>('select chave, valor from preferencias where usuario_id = $1 and atualizado_em > $2', [id, desde]),
  ])
  return c.json({
    agora,
    cartoes: cartoes.map(r => r.dados),
    respostas,
    preferencias: Object.fromEntries(prefs.map(p => [p.chave, p.valor])),
  })
})

progresso.post('/', async c => {
  const id = c.var.usuario!.id
  const d = await c.req.json<Envio>()
  const cliente = await pool!.connect()
  try {
    await cliente.query('begin')
    for (const k of d.cartoes ?? [])
      // Se dois aparelhos responderam o mesmo cartão, fica a revisão mais recente.
      await cliente.query(
        `insert into cartoes (usuario_id, id, dados) values ($1, $2, $3)
         on conflict (usuario_id, id) do update set dados = excluded.dados, atualizado_em = now()
         where coalesce(excluded.dados->'card'->>'last_review', '') >= coalesce(cartoes.dados->'card'->>'last_review', '')`,
        [id, k.id, JSON.stringify(k)])
    for (const r of d.respostas ?? [])
      await cliente.query(
        `insert into respostas (usuario_id, exercicio, texto, em) values ($1, $2, $3, $4)
         on conflict (usuario_id, exercicio) do update set texto = excluded.texto, em = excluded.em, atualizado_em = now()
         where excluded.em >= respostas.em`,
        [id, r.exercicio, r.texto, r.em])
    for (const [chave, valor] of Object.entries(d.preferencias ?? {}))
      await cliente.query(
        `insert into preferencias (usuario_id, chave, valor) values ($1, $2, $3)
         on conflict (usuario_id, chave) do update set valor = excluded.valor, atualizado_em = now()`,
        [id, chave, JSON.stringify(valor)])
    await cliente.query('commit')
  } catch (e) {
    await cliente.query('rollback')
    throw e
  } finally {
    cliente.release()
  }
  return c.json({ ok: true })
})

/** "Apagar progresso" (Ajustes): apaga cartões e respostas da conta. */
progresso.delete('/', async c => {
  const id = c.var.usuario!.id
  await q('delete from cartoes where usuario_id = $1', [id])
  await q('delete from respostas where usuario_id = $1', [id])
  return c.json({ ok: true })
})

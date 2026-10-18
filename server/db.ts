// Banco de dados (PostgreSQL no Railway): usuários, sessões, progresso e imagens dos flashcards.
// As tabelas são criadas na primeira vez que o servidor sobe; não há migrações separadas.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

export const pool = process.env.DATABASE_URL
  ? new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    // A conexão pela internet (de fora do Railway, no `npm run dev`) exige SSL; a interna e a local, não.
    ssl: /\.railway\.internal|localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? undefined : { rejectUnauthorized: false },
    max: Number(process.env.PG_POOL_MAX ?? 5),
  })
  : null

export async function q<T extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, params: unknown[] = []) {
  if (!pool) throw new Error('Sem banco de dados (DATABASE_URL não definida).')
  return (await pool.query<T>(sql, params)).rows
}

const ESQUEMA = `
create table if not exists usuarios (
  id serial primary key,
  email text unique not null,
  nome text,
  senha_hash text,
  google_id text unique,
  admin boolean not null default false,
  criado_em timestamptz not null default now()
);
create table if not exists sessoes (
  token_hash text primary key,
  usuario_id int not null references usuarios on delete cascade,
  expira_em timestamptz not null
);
-- Progresso. Cada linha guarda o registro do navegador inteiro (jsonb); "atualizado_em" é do servidor
-- e serve para cada aparelho baixar só o que mudou desde a última sincronização.
create table if not exists cartoes (
  usuario_id int not null references usuarios on delete cascade,
  id text not null,
  dados jsonb not null,
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id, id)
);
create table if not exists respostas (
  usuario_id int not null references usuarios on delete cascade,
  exercicio text not null,
  texto text not null,
  em timestamptz not null,
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id, exercicio)
);
create table if not exists preferencias (
  usuario_id int not null references usuarios on delete cascade,
  chave text not null,
  valor jsonb,
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id, chave)
);
-- Imagens dos flashcards (o arquivo WebP fica no próprio banco).
create table if not exists imagens (
  id text primary key,
  arquivo bytea not null,
  titulo text not null,
  descricao text,
  autor text,
  data text,
  acervo text,
  licenca text not null default 'não informada',
  url text,
  foco text,
  criado_em timestamptz not null default now()
);
create table if not exists palavras_imagens (
  chave text primary key,
  imagem_id text not null references imagens on delete cascade
);
`

export async function preparar() {
  if (!pool) { console.warn('⚠ DATABASE_URL não definida: login, progresso na nuvem e imagens do banco ficam desligados.'); return }
  await pool.query(ESQUEMA)
  await semearImagens()
}

/** Na primeira vez, copia as imagens que estavam no projeto (content/public/imagens.json + public/imagens/). */
async function semearImagens() {
  const [{ n }] = await q<{ n: string }>('select count(*) as n from imagens')
  if (+n > 0) return
  const raiz = join(import.meta.dirname, '..')
  const arqCat = join(raiz, 'content/public/imagens.json')
  if (!existsSync(arqCat)) return
  const cat = JSON.parse(readFileSync(arqCat, 'utf8')) as {
    imagens: Record<string, Record<string, string | undefined> & { arquivo: string; titulo: string; licenca: string }>
    palavras: Record<string, string>
  }
  const cliente = await pool!.connect()
  let feitas = 0
  try {
    await cliente.query('begin')
    for (const [id, i] of Object.entries(cat.imagens)) {
      const f = join(raiz, 'public/imagens', i.arquivo)
      if (!existsSync(f)) continue
      await cliente.query(
        `insert into imagens (id, arquivo, titulo, descricao, autor, data, acervo, licenca, url, foco)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict do nothing`,
        [id, readFileSync(f), i.titulo, i.descricao, i.autor, i.data, i.acervo, i.licenca, i.url, i.foco])
      feitas++
    }
    for (const [chave, id] of Object.entries(cat.palavras))
      await cliente.query(
        'insert into palavras_imagens (chave, imagem_id) select $1, $2 where exists (select 1 from imagens where id = $2) on conflict do nothing',
        [chave, id])
    await cliente.query('commit')
    console.log(`Imagens copiadas para o banco: ${feitas}.`)
  } catch (e) {
    await cliente.query('rollback')
    throw e
  } finally {
    cliente.release()
  }
}

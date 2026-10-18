// Contas e sessões: cadastro com e-mail e senha, entrada com Google, sessão num cookie.
// A senha é guardada embaralhada (scrypt com sal); o cookie guarda um token aleatório, e o banco
// guarda só o hash do token (quem ler o banco não consegue entrar como ninguém).
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { Hono, type Context, type Next } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { q } from './db.ts'

const scryptAsync = promisify(scrypt) as (s: string, sal: Buffer, n: number) => Promise<Buffer>
const COOKIE = 'ag_sessao'
const DIAS = 180
const producao = process.env.NODE_ENV === 'production'

export interface Usuario { id: number; email: string; nome: string | null; admin: boolean }
export type Env = { Variables: { usuario: Usuario | null } }

const hash = (s: string) => createHash('sha256').update(s).digest('hex')

async function embaralhar(senha: string) {
  const sal = randomBytes(16)
  return `scrypt:${sal.toString('hex')}:${(await scryptAsync(senha, sal, 64)).toString('hex')}`
}
async function conferir(senha: string, guardado: string) {
  const [, sal, h] = guardado.split(':')
  const calc = await scryptAsync(senha, Buffer.from(sal, 'hex'), 64)
  return timingSafeEqual(calc, Buffer.from(h, 'hex'))
}

/** O e-mail em ADMIN_EMAIL (variável do Railway) é o administrador: só ele troca as imagens. */
const ehAdmin = (email: string) => (process.env.ADMIN_EMAIL ?? '').toLowerCase().split(',').map(s => s.trim()).includes(email)

async function abrirSessao(c: Context, usuarioId: number) {
  const token = randomBytes(32).toString('base64url')
  await q(`insert into sessoes (token_hash, usuario_id, expira_em) values ($1, $2, now() + interval '${DIAS} days')`, [hash(token), usuarioId])
  setCookie(c, COOKIE, token, { httpOnly: true, sameSite: 'Lax', secure: producao, path: '/', maxAge: DIAS * 86400 })
}

/** Lê o cookie de sessão e põe o usuário (ou null) em c.var.usuario. */
export async function lerSessao(c: Context<Env>, next: Next) {
  const token = getCookie(c, COOKIE)
  let usuario: Usuario | null = null
  if (token) {
    const [u] = await q<Usuario>(
      `select u.id, u.email, u.nome, u.admin from sessoes s join usuarios u on u.id = s.usuario_id
       where s.token_hash = $1 and s.expira_em > now()`, [hash(token)]).catch(() => [])
    usuario = u ?? null
  }
  c.set('usuario', usuario)
  await next()
}

export const exigirLogin = async (c: Context<Env>, next: Next) => {
  if (!c.var.usuario) return c.text('Entre na sua conta.', 401)
  await next()
}
export const exigirAdmin = async (c: Context<Env>, next: Next) => {
  if (!c.var.usuario?.admin) return c.text('Só o administrador pode fazer isso.', 403)
  await next()
}

// Freio simples contra quem tenta adivinhar senhas: no máximo 10 tentativas por 15 min por IP.
const tentativas = new Map<string, { n: number; desde: number }>()
function freio(c: Context) {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? 'local'
  const agora = Date.now()
  const t = tentativas.get(ip)
  if (!t || agora - t.desde > 15 * 60000) { tentativas.set(ip, { n: 1, desde: agora }); return false }
  return ++t.n > 10
}

const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export const auth = new Hono<Env>()

auth.get('/eu', c => c.json({ usuario: c.var.usuario, google: !!process.env.GOOGLE_CLIENT_ID }))

auth.post('/cadastro', async c => {
  if (freio(c)) return c.text('Muitas tentativas. Espere alguns minutos.', 429)
  const { email: e, senha, nome } = await c.req.json<{ email: string; senha: string; nome?: string }>()
  const email = String(e ?? '').trim().toLowerCase()
  if (!emailValido(email)) return c.text('E-mail inválido.', 400)
  if (String(senha ?? '').length < 8) return c.text('A senha precisa ter pelo menos 8 caracteres.', 400)
  const [existe] = await q('select 1 from usuarios where email = $1', [email])
  if (existe) return c.text('Já existe uma conta com esse e-mail. Use "Entrar".', 409)
  const [u] = await q<{ id: number }>(
    'insert into usuarios (email, nome, senha_hash, admin) values ($1, $2, $3, $4) returning id',
    [email, nome?.trim() || null, await embaralhar(senha), ehAdmin(email)])
  await abrirSessao(c, u.id)
  return c.json({ ok: true })
})

auth.post('/entrar', async c => {
  if (freio(c)) return c.text('Muitas tentativas. Espere alguns minutos.', 429)
  const { email: e, senha } = await c.req.json<{ email: string; senha: string }>()
  const email = String(e ?? '').trim().toLowerCase()
  const [u] = await q<{ id: number; senha_hash: string | null; admin: boolean }>('select id, senha_hash, admin from usuarios where email = $1', [email])
  if (!u?.senha_hash || !(await conferir(String(senha ?? ''), u.senha_hash)))
    return c.text(u && !u.senha_hash ? 'Esta conta usa o login do Google.' : 'E-mail ou senha incorretos.', 401)
  if (ehAdmin(email) !== u.admin) await q('update usuarios set admin = $2 where id = $1', [u.id, ehAdmin(email)])
  await abrirSessao(c, u.id)
  return c.json({ ok: true })
})

auth.post('/sair', async c => {
  const token = getCookie(c, COOKIE)
  if (token) await q('delete from sessoes where token_hash = $1', [hash(token)])
  deleteCookie(c, COOKIE, { path: '/' })
  return c.json({ ok: true })
})

// ---- Google (OAuth 2.0). Só funciona com GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET definidos. ----
const urlBase = (c: Context) => process.env.PUBLIC_URL ?? new URL(c.req.url).origin
const retorno = (c: Context) => `${urlBase(c)}/api/auth/google/retorno`

auth.get('/google', c => {
  const estado = randomBytes(16).toString('base64url')
  setCookie(c, 'ag_oauth', estado, { httpOnly: true, sameSite: 'Lax', secure: producao, path: '/', maxAge: 600 })
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '', redirect_uri: retorno(c), response_type: 'code',
    scope: 'openid email profile', state: estado, prompt: 'select_account',
  })
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${p}`)
})

auth.get('/google/retorno', async c => {
  const { code, state } = c.req.query()
  if (!code || !state || state !== getCookie(c, 'ag_oauth')) return c.redirect('/entrar.html?erro=google')
  deleteCookie(c, 'ag_oauth', { path: '/' })
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: process.env.GOOGLE_CLIENT_ID ?? '', client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: retorno(c), grant_type: 'authorization_code',
    }),
  })
  if (!r.ok) return c.redirect('/entrar.html?erro=google')
  const { access_token } = await r.json() as { access_token: string }
  const info = await (await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${access_token}` } }))
    .json() as { sub: string; email: string; email_verified: boolean; name?: string }
  if (!info.email_verified) return c.redirect('/entrar.html?erro=google')
  const email = info.email.toLowerCase()
  // Mesma pessoa = mesmo e-mail: a conta com senha e a do Google viram uma só.
  const [u] = await q<{ id: number }>(
    `insert into usuarios (email, nome, google_id, admin) values ($1, $2, $3, $4)
     on conflict (email) do update set google_id = excluded.google_id, admin = excluded.admin,
       nome = coalesce(usuarios.nome, excluded.nome)
     returning id`, [email, info.name ?? null, info.sub, ehAdmin(email)])
  await abrirSessao(c, u.id)
  return c.redirect('/')
})

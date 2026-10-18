// Servidor do site (Railway): entrega o site já construído (dist/) e a API em /api.
//   /api/auth/*      cadastro, entrar, sair, Google, quem sou eu
//   /api/progresso   progresso do usuário (flashcards, respostas, preferências)
//   /api/imagens     imagens dos flashcards (guardadas no banco)
// Roda direto com `node server/index.ts` (o Node lê TypeScript sem compilar).
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { auth, lerSessao, type Env } from './auth.ts'
import { pool, preparar } from './db.ts'
import { imagens } from './imagens.ts'
import { progresso } from './progresso.ts'

const app = new Hono<Env>()

// Contra ataques de outro site: escrita só com JSON (um formulário de fora não consegue enviar JSON).
app.use('/api/*', async (c, next) => {
  const m = c.req.method
  if (m !== 'GET' && m !== 'HEAD' && m !== 'DELETE' && !c.req.header('content-type')?.includes('application/json'))
    return c.text('Envie JSON.', 415)
  if (m === 'DELETE' && c.req.header('sec-fetch-site') === 'cross-site') return c.text('Proibido.', 403)
  await next()
})
app.use('/api/*', async (c, next) => {
  if (!pool) return c.text('O servidor está sem banco de dados.', 503)
  await next()
})
app.use('*', lerSessao)
app.route('/api/auth', auth)
app.route('/api/progresso', progresso)
app.route('/api/imagens', imagens)
app.all('/api/*', c => c.text('Não encontrado.', 404))
app.onError((e, c) => { console.error(e); return c.text('Erro no servidor.', 500) })

// O site construído (npm run build:public). O HashRouter faz tudo funcionar a partir de index.html.
// SEM LOGIN, SEM ACESSO: quem não entrou só recebe a página de login (entrar.html) e os arquivos dela.
const dist = join(import.meta.dirname, '../dist')
if (existsSync(dist)) {
  const livres = arquivosDoLogin(dist)
  app.use('*', async (c, next) => {
    const caminho = c.req.path
    if (c.var.usuario || livres.has(caminho)) return next()
    if (caminho === '/' || caminho.endsWith('.html')) return c.redirect('/entrar.html')
    return c.text('Entre na sua conta.', 401)
  })
  app.use('/assets/*', serveStatic({ root: dist, onFound: (_p, c) => { c.header('Cache-Control', 'public, max-age=31536000, immutable') } }))
  app.use('/*', serveStatic({ root: dist }))
  app.get('*', serveStatic({ path: join(dist, 'index.html') }))
}

/** Os arquivos que a página de login usa (do manifesto do Vite): a página, o JS, o CSS e as fontes deles. */
function arquivosDoLogin(dist: string) {
  const livres = new Set(['/entrar.html', '/favicon.ico'])
  const arq = join(dist, '.vite/manifest.json')
  if (!existsSync(arq)) return livres
  const manifesto = JSON.parse(readFileSync(arq, 'utf8')) as Record<string, { file: string; css?: string[]; assets?: string[]; imports?: string[] }>
  const visitar = (chave: string) => {
    const m = manifesto[chave]
    if (!m || livres.has(`/${m.file}`)) return
    for (const f of [m.file, ...(m.css ?? []), ...(m.assets ?? [])]) livres.add(`/${f}`)
    for (const i of m.imports ?? []) visitar(i)
  }
  visitar('entrar.html')
  return livres
}

await preparar()
const porta = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port: porta }, () => console.log(`Servidor em http://localhost:${porta}`))

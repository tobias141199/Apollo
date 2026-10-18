import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import type { IncomingMessage } from 'node:http'
import { join } from 'node:path'
import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'

// `vite build --mode public` gera o site público SEM o pacote privado (content/private).
export default defineConfig(({ mode }) => ({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    {
      name: 'excluir-conteudo-privado',
      enforce: 'pre',
      load(id) {
        if (mode === 'public' && id.includes('/content/private/')) return id.endsWith('.json') ? 'null' : 'export default null'
      },
    },
    editorDeImagens(),
  ],
  server: {
    // O editor de imagens grava o catálogo; sem isto, cada imagem salva recarregaria a página
    // e a sessão de flashcards recomeçaria. O próprio plugin avisa o Vite da mudança.
    watch: { ignored: ['**/content/public/imagens.json'] },
  },
}))

/**
 * Editor de imagens dos flashcards (só no `npm run dev`).
 *   POST   /__imagens  { chave, lema, dados (base64) | link, titulo, autor, data, acervo, url, licenca }
 *   DELETE /__imagens?chave=…
 * Converte para WebP (até 720 px), grava em public/imagens/ e atualiza content/public/imagens.json.
 */
function editorDeImagens(): Plugin {
  const raiz = __dirname
  const arqCatalogo = join(raiz, 'content/public/imagens.json')
  const pasta = join(raiz, 'public/imagens')
  const ler = () => existsSync(arqCatalogo) ? JSON.parse(readFileSync(arqCatalogo, 'utf8')) : { imagens: {}, palavras: {} }
  const ordenar = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))

  function gravar(server: ViteDevServer, cat: { imagens: Record<string, { arquivo: string }>; palavras: Record<string, string> }) {
    // Apaga imagens que nenhuma palavra usa mais (e os arquivos delas).
    const usadas = new Set(Object.values(cat.palavras))
    for (const [id, img] of Object.entries(cat.imagens)) if (!usadas.has(id)) {
      delete cat.imagens[id]
      const f = join(pasta, img.arquivo)
      if (existsSync(f)) unlinkSync(f)
    }
    writeFileSync(arqCatalogo, JSON.stringify({ imagens: ordenar(cat.imagens), palavras: ordenar(cat.palavras) }, null, 2) + '\n')
    // Ao recarregar a página, o Vite relê o catálogo (sem recarregar agora).
    const mod = server.moduleGraph.getModuleById(arqCatalogo)
    if (mod) server.moduleGraph.invalidateModule(mod)
  }

  const corpo = (req: IncomingMessage) => new Promise<string>((ok, erro) => {
    let s = ''
    req.on('data', c => { s += c })
    req.on('end', () => ok(s))
    req.on('error', erro)
  })

  return {
    name: 'editor-de-imagens',
    apply: 'serve',
    configureServer(server) {
      // Serve public/imagens direto do disco: uma imagem recém-salva já aparece, sem esperar o Vite notar o arquivo novo.
      server.middlewares.use('/imagens', (req, res, next) => {
        const f = join(pasta, decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\/+/, ''))
        if (!f.startsWith(pasta + '/') || !f.endsWith('.webp') || !existsSync(f)) return next()
        res.setHeader('Content-Type', 'image/webp')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(readFileSync(f))
      })
      server.middlewares.use('/__imagens', async (req, res) => {
        try {
          const cat = ler()
          if (req.method === 'DELETE') {
            const chave = new URL(req.url ?? '', 'http://x').searchParams.get('chave') ?? ''
            delete cat.palavras[chave]
            gravar(server, cat)
            res.end('ok')
            return
          }
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
          const p = JSON.parse(await corpo(req))
          let bruto: Buffer
          if (p.dados) bruto = Buffer.from(p.dados, 'base64')
          else {
            const r = await fetch(p.link, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AprendendoGrego/0.1)' } })
            if (!r.ok) throw new Error(`Não consegui baixar a imagem desse endereço (HTTP ${r.status}).`)
            bruto = Buffer.from(await r.arrayBuffer())
          }
          const { default: sharp } = await import('sharp')
          // Nome do arquivo: o lema transliterado + um carimbo (evita que o navegador mostre a imagem antiga).
          const id = `${translit(p.chave) || 'palavra'}-${Date.now().toString(36)}`
          await sharp(bruto).rotate().resize({ width: 720, height: 720, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 75 }).toFile(join(pasta, `${id}.webp`))
          const img: Record<string, string> = { arquivo: `${id}.webp`, titulo: p.titulo || p.lema, licenca: p.licenca || 'não informada' }
          for (const k of ['autor', 'data', 'acervo', 'url'] as const) if (p[k]?.trim()) img[k] = p[k].trim()
          if (!img.url && p.link) img.url = p.link
          if (img.licenca.startsWith('CC BY') && !img.autor) throw new Error(`A licença ${img.licenca} exige o nome do autor.`)
          cat.imagens[id] = img
          cat.palavras[p.chave] = id
          gravar(server, cat)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ...img, id, src: `${server.config.base}imagens/${id}.webp` }))
        } catch (e) {
          res.statusCode = 400
          res.end(e instanceof Error ? e.message : String(e))
        }
      })
    },
  }
}

/** Transliteração simples do grego (já sem acentos) para o nome do arquivo. */
function translit(s: string) {
  const t: Record<string, string> = { α: 'a', β: 'b', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'e', θ: 'th', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'ph', χ: 'ch', ψ: 'ps', ω: 'o' }
  return [...s].map(c => t[c] ?? (/[a-z0-9]/.test(c) ? c : '-')).join('').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

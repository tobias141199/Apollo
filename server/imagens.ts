// Imagens dos flashcards, guardadas no banco. Todos veem; só o administrador troca ou remove.
import { Hono } from 'hono'
import sharp from 'sharp'
import { exigirAdmin, type Env } from './auth.ts'
import { q } from './db.ts'

const CAMPOS = 'id, titulo, descricao, autor, data, acervo, licenca, url, foco'
type Meta = { id: string; titulo: string } & Record<string, string | null>
const limpar = (m: Meta) => Object.fromEntries(Object.entries(m).filter(([, v]) => v != null && v !== ''))

export const imagens = new Hono<Env>()

/** Catálogo: dados de cada imagem (sem o arquivo) e qual imagem vai em cada palavra. */
imagens.get('/', async c => {
  const [lista, palavras] = await Promise.all([
    q<Meta>(`select ${CAMPOS} from imagens`),
    q<{ chave: string; imagem_id: string }>('select chave, imagem_id from palavras_imagens'),
  ])
  c.header('Cache-Control', 'no-cache')
  return c.json({
    imagens: Object.fromEntries(lista.map(m => [m.id, limpar(m)])),
    palavras: Object.fromEntries(palavras.map(p => [p.chave, p.imagem_id])),
  })
})

/** O arquivo. O id muda a cada imagem nova, então o navegador pode guardá-lo para sempre. */
imagens.get('/:arquivo{.+\\.webp}', async c => {
  const id = c.req.param('arquivo').replace(/\.webp$/, '')
  const [r] = await q<{ arquivo: Buffer }>('select arquivo from imagens where id = $1', [id])
  if (!r) return c.notFound()
  return c.body(new Uint8Array(r.arquivo), 200, { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' })
})

/** Troca a imagem de uma palavra. Corpo: { chave, lema, dados (base64) | link, titulo, autor, data, acervo, url, licenca }. */
imagens.post('/', exigirAdmin, async c => {
  const p = await c.req.json<Record<string, string | undefined>>()
  if (!p.chave) return c.text('Falta a palavra.', 400)
  let bruto: Buffer
  if (p.dados) bruto = Buffer.from(p.dados, 'base64')
  else if (p.link) {
    const r = await fetch(p.link, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AprendendoGrego/0.1)' } })
    if (!r.ok) return c.text(`Não consegui baixar a imagem desse endereço (HTTP ${r.status}).`, 400)
    bruto = Buffer.from(await r.arrayBuffer())
  } else return c.text('Envie uma imagem.', 400)
  let webp: Buffer
  try {
    webp = await sharp(bruto).rotate().resize({ width: 720, height: 720, fit: 'inside', withoutEnlargement: true }).webp({ quality: 75 }).toBuffer()
  } catch {
    return c.text('Esse arquivo não parece ser uma imagem.', 400)
  }
  const licenca = p.licenca || 'não informada'
  if (licenca.startsWith('CC BY') && !p.autor?.trim()) return c.text(`A licença ${licenca} exige o nome do autor.`, 400)
  const id = `${translit(p.chave) || 'palavra'}-${Date.now().toString(36)}`
  const v = (k: string) => p[k]?.trim() || null
  await q(`insert into imagens (id, arquivo, titulo, autor, data, acervo, licenca, url) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, webp, v('titulo') ?? p.lema ?? p.chave, v('autor'), v('data'), v('acervo'), licenca, v('url') ?? (p.link || null)])
  await q(`insert into palavras_imagens (chave, imagem_id) values ($1, $2) on conflict (chave) do update set imagem_id = excluded.imagem_id`, [p.chave, id])
  await apagarOrfas()
  const [m] = await q<Meta>(`select ${CAMPOS} from imagens where id = $1`, [id])
  return c.json(limpar(m))
})

imagens.delete('/', exigirAdmin, async c => {
  await q('delete from palavras_imagens where chave = $1', [c.req.query('chave') ?? ''])
  await apagarOrfas()
  return c.json({ ok: true })
})

/** Imagens que nenhuma palavra usa mais saem do banco. */
const apagarOrfas = () => q('delete from imagens i where not exists (select 1 from palavras_imagens p where p.imagem_id = i.id)')

/** Transliteração simples do grego (já sem acentos) para o id da imagem. */
function translit(s: string) {
  const t: Record<string, string> = { α: 'a', β: 'b', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'e', θ: 'th', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'ph', χ: 'ch', ψ: 'ps', ω: 'o' }
  return [...s].map(c => t[c] ?? (/[a-z0-9]/.test(c) ? c : '-')).join('').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

// Busca imagens candidatas para os flashcards em três acervos livres:
//   Wikimedia Commons, Metropolitan Museum (Open Access, dep. Greek and Roman Art) e Art Institute of Chicago (dep. Greece, Rome, and Byzantium; domínio público).
//
// Uso: node scripts/imagens/buscar.mjs "<termo em inglês>" [pasta] [--fonte commons|met|aic] [--n 8]
//
// Grava em <pasta> (padrão: ./.candidatos) a folha de contato `folha-<termo>.jpg` (miniaturas
// numeradas, para conferir à vista) e `cand-<termo>.json` (dados de cada candidato, já no formato
// de content/public/imagens.json, faltando só o título em português e a descrição).
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { CABECALHOS } from './comum.mjs'

const args = process.argv.slice(2)
const opc = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d }
const fontes = opc('--fonte', 'commons,met,aic').split(',')
const n = +opc('--n', 8)
const [termo, pasta = '.candidatos'] = args
if (!termo) { console.error('uso: buscar.mjs "<termo>" [pasta] [--fonte commons,met,aic] [--n 8]'); process.exit(1) }

const json = async url => {
  const r = await fetch(url, { headers: CABECALHOS })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}
const limpar = s => (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

/** Converte a licença do Commons para o nosso vocabulário (schema `Licenca`); null = não aceita. */
function licencaCommons(nome = '') {
  const s = nome.trim()
  if (/^cc0/i.test(s)) return 'CC0'
  if (/^(public domain|pd)/i.test(s)) return 'Domínio público'
  const m = s.match(/^CC BY(-SA)? (\d\.\d)/i)
  return m ? `CC BY${m[1] ? '-SA' : ''} ${m[2]}` : null
}

async function commons() {
  const q = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: String(n * 2),
    gsrsearch: `${termo} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '800',
  })
  const d = await json(`https://commons.wikimedia.org/w/api.php?${q}`)
  return Object.values(d.query?.pages ?? {}).sort((a, b) => a.index - b.index).flatMap(p => {
    const ii = p.imageinfo?.[0]; const m = ii?.extmetadata ?? {}
    const licenca = licencaCommons(m.LicenseShortName?.value)
    if (!ii || !licenca) return []
    return [{
      fonte: 'commons', tituloOriginal: p.title.replace(/^File:/, ''),
      autor: limpar(m.Artist?.value).slice(0, 120) || undefined, data: limpar(m.DateTimeOriginal?.value).slice(0, 40) || undefined,
      licenca, url: ii.descriptionurl, origem: ii.thumburl.replace(/\?.*$/, ''), resumo: limpar(m.ImageDescription?.value).slice(0, 200),
    }]
  }).slice(0, n)
}

async function met() {
  const d = await json(`https://collectionapi.metmuseum.org/public/collection/v1.1/search?hasImages=true&departmentId=13&q=${encodeURIComponent(termo)}&limit=${n * 3}`)
  const objs = await Promise.all((d.objectIDs ?? []).slice(0, n * 3).map(id =>
    json(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`).catch(() => null)))
  return objs.filter(o => o?.isPublicDomain && o.primaryImageSmall).map(o => ({
    fonte: 'met', tituloOriginal: o.title, autor: o.artistDisplayName || undefined, data: o.objectDate || undefined,
    acervo: `Metropolitan Museum, Nova York, ${o.accessionNumber}`, licenca: 'CC0', url: o.objectURL,
    origem: o.primaryImageSmall, resumo: [o.culture, o.period, o.medium].filter(Boolean).join(' · '),
  })).slice(0, n)
}

async function aic() {
  // Só o departamento "Arts of Greece, Rome, and Byzantium", e só obras em domínio público.
  const params = {
    q: termo, limit: n,
    fields: ['id', 'title', 'image_id', 'date_display', 'artist_display', 'main_reference_number', 'place_of_origin', 'medium_display'],
    query: { bool: { must: [{ term: { is_public_domain: true } }, { match: { department_title: 'Greece' } }] } },
  }
  const d = await json(`https://api.artic.edu/api/v1/artworks/search?params=${encodeURIComponent(JSON.stringify(params))}`)
  return d.data.filter(a => a.image_id).map(a => ({
    fonte: 'aic', tituloOriginal: a.title, autor: limpar(a.artist_display).split('\n')[0] || undefined, data: a.date_display || undefined,
    acervo: `Art Institute of Chicago, ${a.main_reference_number}`, licenca: 'CC0', url: `https://www.artic.edu/artworks/${a.id}`,
    origem: `https://www.artic.edu/iiif/2/${a.image_id}/full/843,/0/default.jpg`, resumo: [a.place_of_origin, a.medium_display].filter(Boolean).join(' · '),
  }))
}

const busca = { commons, met, aic }
const cands = (await Promise.all(fontes.map(f => busca[f]().catch(e => { console.error(`[${f}] ${e.message}`); return [] })))).flat()

// Folha de contato: miniaturas 260×260 numeradas.
const L = 260, COLS = 4
const miniaturas = await Promise.all(cands.map(async (c, i) => {
  try {
    const r = await fetch(c.origem, { headers: CABECALHOS })
    if (!r.ok) throw new Error(String(r.status))
    const rotulo = Buffer.from(`<svg width="${L}" height="${L}"><rect width="44" height="30" fill="#000" opacity=".75"/><text x="8" y="22" font-size="20" font-family="sans-serif" fill="#fff">${i + 1}</text><text x="${L - 6}" y="${L - 8}" font-size="13" text-anchor="end" font-family="sans-serif" fill="#ff0">${c.fonte}</text></svg>`)
    return await sharp(Buffer.from(await r.arrayBuffer())).resize(L, L, { fit: 'contain', background: '#222' })
      .composite([{ input: rotulo }]).png().toBuffer()
  } catch (e) { c.erro = String(e.message); return null }
}))
mkdirSync(pasta, { recursive: true })
const nome = termo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const linhas = Math.max(1, Math.ceil(cands.length / COLS))
await sharp({ create: { width: COLS * L, height: linhas * L, channels: 3, background: '#111' } })
  .composite(miniaturas.flatMap((m, i) => m ? [{ input: m, left: (i % COLS) * L, top: Math.floor(i / COLS) * L }] : []))
  .jpeg({ quality: 80 }).toFile(join(pasta, `folha-${nome}.jpg`))
writeFileSync(join(pasta, `cand-${nome}.json`), JSON.stringify(cands, null, 1))
cands.forEach((c, i) => console.log(`${i + 1}. [${c.fonte}] ${c.tituloOriginal} | ${c.data ?? ''} | ${c.licenca}${c.erro ? ' | ERRO ' + c.erro : ''}\n   ${c.resumo ?? ''}`))
console.log(`\nfolha: ${join(pasta, `folha-${nome}.jpg`)}`)

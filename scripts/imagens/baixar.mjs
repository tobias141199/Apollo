// Baixa as imagens de content/public/imagens.json que ainda não estão em public/imagens/
// e as converte para WebP (até 720 px de largura, qualidade 72).
//
// Uso: node scripts/imagens/baixar.mjs [--refazer]
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { CABECALHOS } from './comum.mjs'

const raiz = new URL('../../', import.meta.url).pathname
const destino = join(raiz, 'public/imagens')
const { imagens } = JSON.parse(readFileSync(join(raiz, 'content/public/imagens.json'), 'utf8'))
const refazer = process.argv.includes('--refazer')
mkdirSync(destino, { recursive: true })

let novos = 0, falhas = 0
for (const [id, img] of Object.entries(imagens)) {
  const arq = join(destino, img.arquivo)
  if (existsSync(arq) && !refazer) continue
  try {
    // O Commons limita pedidos em sequência (429): espera e tenta de novo.
    let r
    for (let t = 0; t < 6; t++) {
      r = await fetch(img.origem, { headers: CABECALHOS })
      if (r.status !== 429 && r.status !== 503) break
      await new Promise(ok => setTimeout(ok, 4000 * (t + 1)))
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    await sharp(Buffer.from(await r.arrayBuffer())).rotate()
      .resize({ width: 720, height: 720, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 72, effort: 5 }).toFile(arq)
    novos++
    console.log(`ok  ${id}`)
  } catch (e) {
    falhas++
    console.error(`ERRO ${id}: ${e.message}`)
  }
  await new Promise(r => setTimeout(r, 250)) // gentileza com os servidores
}
const total = readdirSync(destino).reduce((s, f) => s + statSync(join(destino, f)).size, 0)
console.log(`\n${novos} baixadas, ${falhas} falhas · pasta com ${(total / 1e6).toFixed(1)} MB`)
if (falhas) process.exit(1)

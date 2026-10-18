// Passa um candidato de `buscar.mjs` para o catálogo (content/public/imagens.json) e o associa a palavras.
//
// Uso:
//   node scripts/imagens/escolher.mjs <cand-….json> <nº> <id> --titulo "Título em português" \
//        --palavras "ἀγρός,γεωργέω" [--descricao "…"] [--data "…"] [--autor "…"] [--acervo "…"] [--foco "50% 30%"] \
//        [--catalogo outro.json]
//
// <nº> é o número do candidato na folha de contato. As palavras são lemas gregos; a chave é a
// mesma de src/lib/greek.ts. Com --catalogo, grava num arquivo de lote em vez do catálogo principal.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chave } from '../../src/lib/greek.ts'

const raiz = new URL('../../', import.meta.url).pathname
const args = process.argv.slice(2)
const opc = k => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : undefined }
const titulo = opc('--titulo'), palavras = opc('--palavras'), descricao = opc('--descricao'), foco = opc('--foco')
const data = opc('--data'), autor = opc('--autor'), acervo = opc('--acervo')
const catalogo = opc('--catalogo') ?? join(raiz, 'content/public/imagens.json')
const [arqCand, num, id] = args
if (!arqCand || !num || !id || !titulo || !palavras) {
  console.error('uso: escolher.mjs <cand.json> <nº> <id> --titulo "…" --palavras "λ1,λ2" [--descricao "…"] [--foco "…"]')
  process.exit(1)
}
if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`id inválido (use a-z, 0-9 e hífen): ${id}`)
const c = JSON.parse(readFileSync(arqCand, 'utf8'))[+num - 1]
if (!c) throw new Error(`candidato ${num} não existe em ${arqCand}`)

const cat = existsSync(catalogo) ? JSON.parse(readFileSync(catalogo, 'utf8')) : { imagens: {}, palavras: {} }
const img = {
  arquivo: `${id}.webp`, titulo, descricao,
  autor: autor ?? c.autor, data: data ?? c.data, acervo: acervo ?? c.acervo,
  licenca: c.licenca, url: c.url, origem: c.origem, foco,
}
for (const k of Object.keys(img)) if (img[k] === undefined || img[k] === '') delete img[k]
cat.imagens[id] = img
for (const p of palavras.split(',').map(s => s.trim()).filter(Boolean)) {
  const k = chave(p.normalize('NFC'))
  if (cat.palavras[k] && cat.palavras[k] !== id) console.warn(`aviso: ${p} trocou ${cat.palavras[k]} → ${id}`)
  cat.palavras[k] = id
}
// Ordena para que os diffs fiquem estáveis.
const ordenar = o => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(catalogo, JSON.stringify({ imagens: ordenar(cat.imagens), palavras: ordenar(cat.palavras) }, null, 2) + '\n')
console.log(`${id} ← ${c.tituloOriginal} [${c.licenca}] · palavras: ${palavras}`)

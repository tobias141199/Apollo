// Garante que o build público não contém o pacote privado.
// Citações curtas (< 300 caracteres) são permitidas no público, então procuramos
// blocos de 300 caracteres dos textos e exercícios inteiros (3+ itens) do privado.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const pastas = ['content/private/sections', 'content/private/athenaze'].filter(existsSync)
if (!pastas.length) { console.log('✓ sem pacote privado local; nada a verificar'); process.exit(0) }

const arquivos = []
const andar = d => readdirSync(d).forEach(f => { const p = join(d, f); statSync(p).isDirectory() ? andar(p) : arquivos.push(p) })
andar('dist')
const dist = arquivos.filter(f => /\.(js|html|json)$/.test(f)).map(f => readFileSync(f, 'utf8')).join('\n')
const contem = s => dist.includes(s) || dist.includes(JSON.stringify(s).slice(1, -1))

const vazados = []
let verificados = 0
for (const priv of pastas) for (const f of readdirSync(priv).filter(f => f.endsWith('.json'))) {
  const s = JSON.parse(readFileSync(join(priv, f), 'utf8'))
  for (const t of s.textos ?? []) for (let i = 0; i + 300 <= t.grego.length; i += 150) {
    verificados++
    if (contem(t.grego.slice(i, i + 300))) { vazados.push(`${s.id} texto: ${t.grego.slice(i, i + 50)}…`); break }
  }
  for (const e of s.exercicios ?? []) {
    verificados++
    const achados = (e.itens ?? []).filter(i => i.pergunta?.length > 15 && contem(i.pergunta)).length
    if (achados >= 3) vazados.push(`${s.id} exercício ${e.id} (${achados} itens)`)
  }
}
if (vazados.length) {
  console.error(`✗ conteúdo privado encontrado em dist/:`, vazados.slice(0, 10))
  process.exit(1)
}
console.log(`✓ build público limpo (${verificados} blocos privados verificados)`)

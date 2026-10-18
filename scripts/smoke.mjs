// Teste rápido de fumaça: abre as páginas principais num Chromium headless e tira screenshots.
// Uso: node scripts/smoke.mjs <url-base> <pasta-de-saida>
import { chromium } from 'playwright'
const [base = 'http://localhost:5173', out = 'smoke'] = process.argv.slice(2)
const rotas = ['/', '/trilha', '/secoes', '/secao/1A', '/capitulo/1', '/capitulo/4', '/capitulo/9', '/vocabulario', '/palavra/' + encodeURIComponent('ανθρωποσ'),
  '/flashcards', '/quiz', '/tabelas?t=artigo,decl2-masc,decl1-a,verbo-presente-ativo', '/ajustes',
  '/janela?t=artigo,decl2-masc,decl1-a']
const browser = await chromium.launch()
let falhas = 0
for (const [nome, vp] of [['desktop', { width: 1280, height: 900 }], ['celular', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: vp })
  const erros = []
  page.on('pageerror', e => erros.push(e.message))
  page.on('console', m => m.type() === 'error' && erros.push(m.text()))
  for (const r of rotas) {
    await page.goto(`${base}/#${r}`)
    await page.waitForTimeout(400)
    const largura = await page.evaluate(() => document.documentElement.scrollWidth)
    if (largura > vp.width + 1) erros.push(`${r}: rolagem horizontal (${largura}px)`)
    await page.screenshot({ path: `${out}/${nome}-${r.replace(/[^a-z0-9]+/gi, '_')}.png`, fullPage: false })
  }
  // Janela flutuante: destaca uma tabela e confere que ela continua aberta em outra página.
  await page.goto(`${base}/#/tabelas?t=artigo,decl2-masc`)
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: /janela flutuante/ }).click()
  await page.goto(`${base}/#/flashcards`)
  await page.waitForTimeout(400)
  if (!(await page.locator('.janela').count())) erros.push('janela flutuante sumiu ao trocar de página')
  const larg = await page.evaluate(() => document.documentElement.scrollWidth)
  if (larg > vp.width + 1) erros.push(`janela flutuante: rolagem horizontal (${larg}px)`)
  await page.screenshot({ path: `${out}/${nome}-janela-flutuante.png` })
  await page.evaluate(() => localStorage.removeItem('ag:janelas'))
  if (erros.length) { falhas++; console.log(nome, 'ERROS:', [...new Set(erros)]) } else console.log(nome, 'ok')
  await page.close()
}
await browser.close()
process.exit(falhas ? 1 : 0)

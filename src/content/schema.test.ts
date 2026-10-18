// Valida todo o conteúdo (público e, se existir, privado). Rode com `npm run validate`.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Capitulo, CatalogoImagens, Concordancia, Paradigma, Secao, Trilha, type Vocab, type Gramatica, type Exercicio, type Ponte } from './schema'

const raiz = join(__dirname, '../../content')
const ler = (p: string) => JSON.parse(readFileSync(p, 'utf8'))
const jsons = (dir: string) => existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json')).map(f => join(dir, f)) : []

const paradigmas = jsons(join(raiz, 'public/paradigms'))
const idsParad = new Set(paradigmas.map(p => ler(p).id))
const idsSecoes = new Set(jsons(join(raiz, 'public/sections')).map(a => ler(a).id as string))

/** Regras comuns a seções da JACT e capítulos do Athenaze. */
function conferirLicao(l: { vocab: Vocab[]; gramatica: Gramatica[]; exercicios: Exercicio[]; textos: { grego: string }[] }, pacote: string, pontes: (Ponte | undefined)[]) {
  for (const v of l.vocab) {
    expect(v.grego.normalize('NFC'), `grego deve estar em NFC: ${v.grego}`).toBe(v.grego)
    if (v.paradigma) expect(idsParad.has(v.paradigma), `paradigma inexistente: ${v.paradigma}`).toBe(true)
  }
  for (const g of l.gramatica) for (const p of g.paradigmas ?? [])
    expect(idsParad.has(p), `paradigma inexistente: ${p}`).toBe(true)
  for (const t of l.textos) expect(t.grego.normalize('NFC'), 'texto grego deve estar em NFC').toBe(t.grego)
  if (pacote === 'public') {
    // Regra de direitos autorais: no pacote público não há exercícios nem textos copiados dos livros.
    for (const e of l.exercicios) expect(e.fonte.livro, `exercício ${e.id} público deve ser original`).toBe('original')
    for (const t of l.textos) expect(t.grego.length, 'trecho público longo demais').toBeLessThan(300)
    for (const p of pontes) for (const c of p?.citacoes ?? []) expect(c.grego.length, 'citação pública longa demais').toBeLessThan(300)
  }
}

for (const pacote of ['public', 'private']) {
  describe(`seções (${pacote})`, () => {
    for (const arq of jsons(join(raiz, pacote, 'sections'))) {
      it(arq.split('/').pop()!, () => {
        const r = Secao.safeParse(ler(arq))
        if (!r.success) throw new Error(JSON.stringify(r.error.issues.slice(0, 5), null, 1))
        const s = r.data
        expect(arq.endsWith(`${s.id}.json`)).toBe(true)
        expect(s.secao).toBe(parseInt(s.id))
        conferirLicao(s, pacote, [s.athenaze && { ...s.athenaze, correspondentes: [] }])
      })
    }
  })
  describe(`capítulos do Athenaze (${pacote})`, () => {
    for (const arq of jsons(join(raiz, pacote, 'athenaze'))) {
      it(arq.split('/').pop()!, () => {
        const r = Capitulo.safeParse(ler(arq))
        if (!r.success) throw new Error(JSON.stringify(r.error.issues.slice(0, 5), null, 1))
        const c = r.data
        expect(arq.endsWith(`${c.id}.json`)).toBe(true)
        expect(c.id).toBe(`ath${c.capitulo}`)
        conferirLicao(c, pacote, [c.jact])
        for (const id of c.jact?.correspondentes ?? []) expect(idsSecoes.has(id), `seção inexistente: ${id}`).toBe(true)
      })
    }
  })
}

describe('trilha', () => {
  it('contém cada seção da JACT e cada capítulo do Athenaze exatamente uma vez', () => {
    const arq = join(raiz, 'public/trilha.json')
    const t = Trilha.parse(ler(arq))
    const ids = t.etapas.flatMap(e => e.passos.map(p => p.licao))
    const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(repetidos, 'lições repetidas na trilha').toEqual([])
    for (const s of idsSecoes) expect(ids, `seção ${s} fora da trilha`).toContain(s)
    for (let n = 1; n <= 16; n++) expect(ids, `cap. ${n} fora da trilha`).toContain(`ath${n}`)
    for (const id of ids) if (!id.startsWith('ath')) expect(idsSecoes.has(id), `seção inexistente: ${id}`).toBe(true)
  })
})

describe('paradigmas', () => {
  for (const arq of paradigmas) it(arq.split('/').pop()!, () => {
    const p = Paradigma.parse(ler(arq))
    expect(arq.endsWith(`${p.id}.json`)).toBe(true)
    for (const l of p.linhas) expect(l.celulas.length).toBe(p.colunas.length)
  })
})

describe('concordância', () => {
  it('é válida', () => {
    const arq = join(raiz, 'public/concordancia.json')
    if (existsSync(arq)) Concordancia.parse(ler(arq))
  })
})

describe('imagens dos flashcards', () => {
  const arq = join(raiz, 'public/imagens.json')
  const pasta = join(__dirname, '../../public/imagens')
  const cat = existsSync(arq) ? CatalogoImagens.parse(ler(arq)) : { imagens: {}, palavras: {} }
  it('catálogo válido, com crédito e arquivo para cada imagem', () => {
    for (const [id, img] of Object.entries(cat.imagens)) {
      expect(img.arquivo, `arquivo de ${id}`).toBe(`${id}.webp`)
      expect(existsSync(join(pasta, img.arquivo)), `falta public/imagens/${img.arquivo} (rode scripts/imagens/baixar.mjs)`).toBe(true)
      // CC BY e CC BY-SA exigem o nome do autor (ou do fotógrafo) no crédito.
      if (img.licenca.startsWith('CC BY')) expect(img.autor, `${id}: licença ${img.licenca} exige autor`).toBeTruthy()
    }
  })
  it('toda palavra aponta para uma imagem existente, e toda imagem é usada', () => {
    for (const [p, id] of Object.entries(cat.palavras)) expect(cat.imagens[id], `${p} → ${id}`).toBeDefined()
    const usadas = new Set(Object.values(cat.palavras))
    for (const id of Object.keys(cat.imagens)) expect(usadas.has(id), `imagem órfã: ${id}`).toBe(true)
  })
  it('nenhum arquivo solto em public/imagens/', () => {
    const conhecidos = new Set(Object.values(cat.imagens).map(i => i.arquivo))
    for (const f of existsSync(pasta) ? readdirSync(pasta) : []) expect(conhecidos.has(f), `arquivo sem catálogo: ${f}`).toBe(true)
  })
})

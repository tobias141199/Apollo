// Carrega e mescla o conteúdo dos pacotes público e privado.
// O pacote privado (content/private, fora do git) só entra no build local;
// no build público (`npm run build:public`) o plugin em vite.config.ts o substitui por nada.
//
// Há dois tipos de lição: as seções da JACT ("1A") e os capítulos do Athenaze ("ath1").
// As duas viram uma `Licao` com o mesmo formato, e a trilha (trilha.json) as intercala.
import { chave } from '../lib/greek'
import {
  Capitulo, CatalogoImagens, Concordancia, Paradigma, Secao, Trilha,
  type Capitulo as TCapitulo, type Citacao, type Exercicio, type Fonte, type Gramatica,
  type Imagem, type Paradigma as TParadigma, type Ponte, type Secao as TSecao, type Vocab,
} from './schema'

type Mod = Record<string, unknown>
const pubSecoes = import.meta.glob<Mod>('/content/public/sections/*.json', { eager: true, import: 'default' })
const privSecoes = import.meta.glob<Mod>('/content/private/sections/*.json', { eager: true, import: 'default' })
const pubCaps = import.meta.glob<Mod>('/content/public/athenaze/*.json', { eager: true, import: 'default' })
const privCaps = import.meta.glob<Mod>('/content/private/athenaze/*.json', { eager: true, import: 'default' })
const pubParad = import.meta.glob<Mod>('/content/public/paradigms/*.json', { eager: true, import: 'default' })
const pubConc = import.meta.glob<Mod>('/content/public/concordancia.json', { eager: true, import: 'default' })
const pubTrilha = import.meta.glob<Mod>('/content/public/trilha.json', { eager: true, import: 'default' })
const pubImagens = import.meta.glob<Mod>('/content/public/imagens.json', { eager: true, import: 'default' })

export const temPrivado = [...Object.values(privSecoes), ...Object.values(privCaps)].some(Boolean)

/** Vocabulário: o privado substitui entradas com o mesmo lema. */
function mesclarVocab(a: Vocab[], b: Vocab[]): Vocab[] {
  const porLema = new Map<string, Vocab>()
  for (const v of [...a, ...b]) {
    const k = chave(v.grego)
    const ant = porLema.get(k)
    porLema.set(k, ant ? { ...ant, ...v, aprender: ant.aprender || v.aprender } : v)
  }
  return [...porLema.values()]
}

function mesclarPonte(a?: Ponte, b?: Ponte): Ponte | undefined {
  if (!a && !b) return undefined
  return {
    correspondentes: [...new Set([...(a?.correspondentes ?? []), ...(b?.correspondentes ?? [])])],
    comparacao: [a?.comparacao, b?.comparacao].filter(Boolean).join('\n\n') || undefined,
    complementos: [...(a?.complementos ?? []), ...(b?.complementos ?? [])],
    citacoes: [...(a?.citacoes ?? []), ...(b?.citacoes ?? [])],
  }
}

interface ComLicao { vocab: Vocab[]; gramatica: Gramatica[]; exercicios: Exercicio[]; textos: TSecao['textos'] }
function mesclarComum<T extends ComLicao>(a: T, b: T): T {
  // b (privado) complementa a (público).
  return {
    ...a, ...Object.fromEntries(Object.entries(b).filter(([, v]) => v !== undefined)),
    vocab: mesclarVocab(a.vocab, b.vocab),
    gramatica: [...a.gramatica, ...b.gramatica],
    exercicios: [...b.exercicios, ...a.exercicios], // os do livro (privado) primeiro
    textos: [...a.textos, ...b.textos],
  }
}

function mesclarSecao(a: TSecao, b: TSecao): TSecao {
  const p = mesclarPonte(
    a.athenaze && { ...a.athenaze, correspondentes: a.athenaze.capitulos },
    b.athenaze && { ...b.athenaze, correspondentes: b.athenaze.capitulos })
  return { ...mesclarComum(a, b), athenaze: p && { ...p, capitulos: p.correspondentes } }
}
function mesclarCapitulo(a: TCapitulo, b: TCapitulo): TCapitulo {
  return { ...mesclarComum(a, b), jact: mesclarPonte(a.jact, b.jact) }
}

function carregar<T extends { id: string }>(
  arquivos: [string, Mod][], schema: { safeParse: (x: unknown) => { success: true; data: T } | { success: false; error: { issues: unknown } } },
  mesclar: (a: T, b: T) => T,
): Map<string, T> {
  const mapa = new Map<string, T>()
  for (const [arquivo, bruto] of arquivos) {
    if (!bruto) continue
    const r = schema.safeParse(bruto)
    if (!r.success) { console.error(`Conteúdo inválido em ${arquivo}`, r.error.issues); continue }
    const x = r.data
    mapa.set(x.id, mapa.has(x.id) ? mesclar(mapa.get(x.id)!, x) : x)
  }
  return mapa
}

export function ordemSecao(a: { id: string }, b: { id: string }) {
  const [, na, la] = a.id.match(/^(\d+)([A-J])$/)!
  const [, nb, lb] = b.id.match(/^(\d+)([A-J])$/)!
  return +na - +nb || la.localeCompare(lb)
}

export const secoes: TSecao[] = [...carregar(
  [...Object.entries(pubSecoes), ...Object.entries(privSecoes)], Secao as never, mesclarSecao,
).values()].sort(ordemSecao)
export const secaoPorId = new Map(secoes.map(s => [s.id, s]))

const capsCarregados = carregar<TCapitulo>(
  [...Object.entries(pubCaps), ...Object.entries(privCaps)], Capitulo as never, mesclarCapitulo)

export const paradigmas: TParadigma[] = Object.values(pubParad)
  .map(p => Paradigma.parse(p))
  .sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt'))
export const paradigmaPorId = new Map(paradigmas.map(p => [p.id, p]))

export const concordancia = Concordancia.parse(Object.values(pubConc)[0] ?? [])

export const NOMES_SECAO: Record<number, string> = {
  1: 'Um', 2: 'Dois', 3: 'Três', 4: 'Quatro', 5: 'Cinco', 6: 'Seis', 7: 'Sete',
}
export const TITULOS_SECAO: Record<number, string> = {
  1: 'O golpe do seguro', 2: 'O passado glorioso', 3: 'Atenas e Esparta',
  4: 'Desrespeito à lei na vida ateniense', 5: '“Sócrates corrompe os jovens”',
  6: '“Sócrates corrompe os jovens”', 7: 'Sócrates e a investigação intelectual',
}
export const PARTES: Record<number, { titulo: string; secoes: number[] }> = {
  1: { titulo: 'Atenas no mar', secoes: [1, 2, 3] },
  2: { titulo: 'Decadência moral?', secoes: [4, 5, 6, 7] },
}

/** Títulos dos 16 capítulos do Athenaze Book I (usados também para os que ainda não têm conteúdo). */
export const CAPITULOS_ATHENAZE: Record<number, { grego: string; temas: string }> = {
  1: { grego: 'Ὁ Δικαιόπολις', temas: 'presente (3ª sg.), artigo, sujeito e objeto' },
  2: { grego: 'Ὁ Ξανθίας', temas: '1ª–3ª pessoas do sg., imperativo, casos, 2ª decl. masc.' },
  3: { grego: 'Ὁ ἄροτος', temas: '3ª pl., infinitivo, singular e plural, neutros' },
  4: { grego: 'Πρὸς τῇ κρήνῃ', temas: 'todas as pessoas, 1ª declinação, adjetivos, advérbios' },
  5: { grego: 'Ὁ λύκος', temas: 'contratos em -α-, pronomes pessoais, posição atributiva, αὐτός' },
  6: { grego: 'Ὁ μῦθος', temas: 'voz média, depoentes, usos do dativo, preposições' },
  7: { grego: 'Ὁ Κύκλωψ', temas: '3ª declinação em consoante, reflexivos, τίς/τις' },
  8: { grego: 'Πρὸς τὸ ἄστυ', temas: 'particípio médio, ἀνήρ, γυνή, ναῦς' },
  9: { grego: 'Ἡ πανήγυρις', temas: 'particípio ativo, πόλις/ἄστυ, πᾶς' },
  10: { grego: 'Ἡ συμφορά', temas: 'futuro, particípio futuro de finalidade' },
  11: { grego: 'Ὁ ἰατρός', temas: 'aoristo 2º (temático)' },
  12: { grego: 'Πρὸς τὸν Πειραιᾶ', temas: 'aoristo 1º (sigmático), aumento' },
  13: { grego: 'Πρὸς τὴν Σαλαμῖνα', temas: 'imperfeito, orações relativas, 3ª decl. em -εσ-' },
  14: { grego: 'Ἡ ἐν ταῖς Θερμοπύλαις μάχη', temas: 'comparação, numerais' },
  15: { grego: 'Ἡ ἐν τῇ Σαλαμῖνι μάχη', temas: 'contratos em -ο-, demonstrativos' },
  16: { grego: 'Μετὰ τὴν ἐν τῇ Σαλαμῖνι μάχην', temas: 'aoristo e futuro passivos' },
}

/** Capítulos do Athenaze, 1–16. Os que ainda não têm arquivo ficam "em preparação". */
export const capitulos: TCapitulo[] = Array.from({ length: 16 }, (_, i) => {
  const n = i + 1
  return capsCarregados.get(`ath${n}`) ?? {
    id: `ath${n}`, capitulo: n, tituloGrego: CAPITULOS_ATHENAZE[n].grego,
    vocab: [], gramatica: [], exercicios: [], textos: [],
  }
})
export const capituloPorId = new Map(capitulos.map(c => [c.id, c]))

// ---------------------------------------------------------------------------------------------
// Lições: o formato comum que as páginas usam.

export type LivroLicao = 'JACT' | 'Athenaze'
export interface Licao {
  id: string
  livro: LivroLicao
  /** Rótulo curto: "1A" ou "Ath. 3". */
  rotulo: string
  /** Rota na interface: "/secao/1A" ou "/capitulo/3". */
  rota: string
  titulo?: string
  tituloGrego?: string
  resumo?: string
  fonte?: Fonte
  /** Grupo maior: "Seção 1 · O golpe do seguro" ou "Athenaze Book I". */
  grupo: string
  vocab: Vocab[]
  gramatica: Gramatica[]
  exercicios: Exercicio[]
  textos: TSecao['textos']
  cultura?: TCapitulo['cultura']
  /** Ligação com o outro livro. `correspondentes` já vem como ids de lição. */
  ponte?: Ponte
  /** Capítulo do Athenaze cujo conteúdo ainda não foi preparado. */
  emPreparacao: boolean
}

/** "cap. 3 (Ὁ ἄροτος)", "cap. 4 Gram. 6" → "ath3", "ath4". */
const capDe = (s: string) => { const m = s.match(/cap\.\s*(\d+)/); return m && +m[1] <= 16 ? `ath${+m[1]}` : null }

export const rotaLicao = (id: string) => id.startsWith('ath') ? `/capitulo/${id.slice(3)}` : `/secao/${id}`
export const rotuloLicao = (id: string) => id.startsWith('ath') ? `Ath. ${id.slice(3)}` : id

const licoesJact: Licao[] = secoes.map(s => ({
  id: s.id, livro: 'JACT', rotulo: s.id, rota: rotaLicao(s.id),
  titulo: s.titulo, resumo: s.resumo, fonte: s.fonte,
  grupo: `Seção ${s.secao} · ${TITULOS_SECAO[s.secao] ?? ''}`,
  vocab: s.vocab, gramatica: s.gramatica, exercicios: s.exercicios, textos: s.textos,
  ponte: s.athenaze && {
    ...s.athenaze,
    correspondentes: [...new Set(s.athenaze.capitulos.map(capDe).filter((x): x is string => !!x))],
  },
  emPreparacao: false,
}))

const licoesAthenaze: Licao[] = capitulos.map(c => ({
  id: c.id, livro: 'Athenaze', rotulo: rotuloLicao(c.id), rota: rotaLicao(c.id),
  titulo: c.titulo, tituloGrego: c.tituloGrego ?? CAPITULOS_ATHENAZE[c.capitulo].grego,
  resumo: c.resumo ?? (capsCarregados.has(c.id) ? undefined : CAPITULOS_ATHENAZE[c.capitulo].temas),
  fonte: c.fonte, grupo: 'Athenaze Book I',
  vocab: c.vocab, gramatica: c.gramatica, exercicios: c.exercicios, textos: c.textos, cultura: c.cultura,
  ponte: c.jact && { ...c.jact, correspondentes: [...c.jact.correspondentes] }, emPreparacao: !capsCarregados.has(c.id),
}))

// As pontes valem nos dois sentidos: se 1A aponta para o cap. 1, o cap. 1 também aponta para 1A.
for (const a of [...licoesJact, ...licoesAthenaze]) for (const id of a.ponte?.correspondentes ?? []) {
  const b = [...licoesJact, ...licoesAthenaze].find(l => l.id === id)
  if (!b) continue
  b.ponte ??= { correspondentes: [], complementos: [], citacoes: [] }
  if (!b.ponte.correspondentes.includes(a.id)) b.ponte.correspondentes.push(a.id)
}

export const trilha = Trilha.parse(Object.values(pubTrilha)[0] ?? { etapas: [] })

/** Todas as lições na ordem da trilha (as que estiverem fora dela vão para o fim). */
export const licoes: Licao[] = (() => {
  const ordem = new Map(trilha.etapas.flatMap(e => e.passos.map(p => p.licao)).map((id, i) => [id, i]))
  const pos = (l: Licao) => ordem.get(l.id) ?? Infinity
  return [...licoesJact, ...licoesAthenaze].sort((a, b) => pos(a) - pos(b))
})()
export const licaoPorId = new Map(licoes.map(l => [l.id, l]))
for (const l of licoes) l.ponte?.correspondentes.sort((a, b) => licoes.indexOf(licaoPorId.get(a)!) - licoes.indexOf(licaoPorId.get(b)!))

/** Os passos da trilha, já com a lição e o número da etapa. */
export const passosTrilha = trilha.etapas.flatMap((e, etapa) => e.passos
  .filter(p => licaoPorId.has(p.licao))
  .map(p => ({ ...p, etapa, licao: licaoPorId.get(p.licao)! })))

// ---------------------------------------------------------------------------------------------
// Vocabulário geral: uma entrada por lema, reunindo as duas origens.

export interface Origem { licaoId: string; aprender: boolean; glosa: string; fonte: Fonte }
export interface Entrada extends Vocab {
  chave: string
  /** A primeira lição da trilha em que a palavra é "a aprender" (ou, se nunca for, em que aparece). */
  licaoId: string
  /** Todas as lições em que a palavra aparece, na ordem da trilha. */
  origens: Origem[]
  /** Primeira origem em cada livro. */
  jact?: Origem
  athenazeOrigem?: Origem
}

export const vocabulario: Entrada[] = (() => {
  const porChave = new Map<string, { v: Vocab; origens: Origem[] }[]>()
  for (const l of licoes) for (const v of l.vocab) {
    const k = chave(v.grego)
    const lista = porChave.get(k) ?? []
    lista.push({ v, origens: [{ licaoId: l.id, aprender: v.aprender, glosa: v.glosa, fonte: v.fonte }] })
    porChave.set(k, lista)
  }
  return [...porChave.entries()].map(([k, lista]) => {
    const origens = lista.flatMap(x => x.origens)
    const jact = origens.find(o => !o.licaoId.startsWith('ath'))
    const athenazeOrigem = origens.find(o => o.licaoId.startsWith('ath'))
    // A forma da JACT tem prioridade (glosa e lema), por ser o curso de base; senão, a do Athenaze.
    const base = lista.find(x => !x.origens[0].licaoId.startsWith('ath'))?.v ?? lista[0].v
    const principal = origens.find(o => o.aprender) ?? origens[0]
    return {
      ...base,
      aprender: origens.some(o => o.aprender),
      athenaze: base.athenaze ?? (athenazeOrigem ? `cap. ${athenazeOrigem.licaoId.slice(3)}` : undefined),
      paradigma: base.paradigma ?? lista.find(x => x.v.paradigma)?.v.paradigma,
      chave: k, licaoId: principal.licaoId, origens, jact, athenazeOrigem,
    }
  })
})()
export const entradaPorChave = new Map(vocabulario.map(e => [e.chave, e]))

// ---------------------------------------------------------------------------------------------
// Imagens dos flashcards (content/public/imagens.json → public/imagens/).

// O catálogo que vem no pacote é só o ponto de partida: com o servidor no ar, src/lib/nuvem.ts troca
// pelo catálogo do banco (GET /api/imagens), onde as imagens são editadas.
type CatalogoAtual = { imagens: Record<string, Omit<Imagem, 'arquivo' | 'licenca'> & { arquivo?: string; licenca?: string }>; palavras: Record<string, string> }
let catalogo: CatalogoAtual = CatalogoImagens.parse(Object.values(pubImagens)[0] ?? { imagens: {}, palavras: {} })
let baseImagens = `${import.meta.env.BASE_URL}imagens/`
export function definirCatalogo(c: CatalogoAtual, base: string) { catalogo = c; baseImagens = base }
export interface ImagemPalavra extends Omit<Imagem, 'arquivo' | 'licenca'> { id: string; src: string; licenca?: string }
/** A imagem associada a uma palavra (pela chave do lema), com o endereço pronto para <img>. */
export function imagemDe(chavePalavra: string): ImagemPalavra | undefined {
  const id = catalogo.palavras[chavePalavra]
  const img = id ? catalogo.imagens[id] : undefined
  return img && { ...img, id, src: `${baseImagens}${img.arquivo ?? `${id}.webp`}` }
}

/** Citações e exemplos de todas as lições (para o verbete). */
export const todasCitacoes: Citacao[] = licoes.flatMap(l => [
  ...(l.ponte?.citacoes ?? []),
  ...l.gramatica.flatMap(g => g.exemplos ?? []),
])

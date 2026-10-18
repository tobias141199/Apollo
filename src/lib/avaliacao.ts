// Gera a avaliação de uma lição: perguntas de múltipla escolha sobre o vocabulário da lição
// (grego → português e português → grego) e sobre as formas das tabelas que a lição ensina.
// Se a lição tiver pouco material, completa com revisão do vocabulário das lições anteriores.
import { paradigmaPorId, passosTrilha, vocabulario, type Licao } from '../content'
import type { Vocab } from '../content/schema'
import { ACENTO_AGUDO, ACENTO_CIRCUNFLEXO, ACENTO_GRAVE, COM_SIGMA, ESPIRITO_ASPERO, ESPIRITO_BRANDO, LEITURAS, LETRAS, LETRAS_TRAICOEIRAS, PALAVRAS_LEITURA, REGRAS } from '../alfabeto/letras'
import { chave } from './greek'

export interface Pergunta {
  id: string
  /** O que se pergunta, em português. */
  enunciado: string
  /** O que aparece em destaque (uma palavra grega, uma letra…). */
  destaque?: string
  destaqueGrego?: boolean
  opcoes: string[]
  certa: string
  /** As opções são grego? (muda a fonte) */
  opcoesGrego?: boolean
  /** De onde veio a pergunta, para a revisão no fim ("revisão de 1A"). */
  origem?: string
}

export const TAMANHO = 10

const embaralhar = <T,>(a: T[]) => a.map(x => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map(p => p[1])
const unicos = (xs: string[]) => [...new Set(xs)]
/** 3 erradas + a certa, embaralhadas. */
const opcoes = (certa: string, candidatas: string[]) =>
  embaralhar([certa, ...embaralhar(unicos(candidatas.filter(c => c && c !== certa))).slice(0, 3)])

function perguntaVocab(v: Vocab, sentido: 'gp' | 'pg', origem?: string): Pergunta | null {
  const mesmas = vocabulario.filter(e => e.classe === v.classe && chave(e.grego) !== chave(v.grego))
  const outras = mesmas.length >= 6 ? mesmas : vocabulario.filter(e => chave(e.grego) !== chave(v.grego))
  if (sentido === 'gp') {
    const o = opcoes(v.glosa, embaralhar(outras).filter(e => e.glosa !== v.glosa).slice(0, 12).map(e => e.glosa))
    return o.length === 4 ? { id: `gp:${v.grego}`, enunciado: 'O que significa?', destaque: v.grego, destaqueGrego: true, opcoes: o, certa: v.glosa, origem } : null
  }
  const o = opcoes(v.grego, embaralhar(outras).slice(0, 12).map(e => e.grego))
  return o.length === 4 ? { id: `pg:${v.grego}`, enunciado: 'Como se diz em grego?', destaque: v.glosa, opcoes: o, certa: v.grego, opcoesGrego: true, origem } : null
}

const limparForma = (c: string) => c.replace(/\|/g, '')

/** Uma pergunta de forma: "τιμή · genitivo plural?" com outras células da mesma tabela como erradas. */
function perguntaForma(id: string): Pergunta | null {
  const p = paradigmaPorId.get(id)
  if (!p) return null
  const celulas = p.linhas.flatMap(l => l.celulas.map((c, j) => ({ forma: limparForma(c), linha: l.rotulo, coluna: p.colunas[j] })))
    .filter(c => c.forma && c.forma !== '—')
  const alvo = embaralhar(celulas).find(c => celulas.filter(x => x.forma === c.forma).length === 1) // forma sem ambiguidade
  if (!alvo) return null
  const o = opcoes(alvo.forma, celulas.map(c => c.forma))
  if (o.length < 4) return null
  const titulo = p.titulo.replace(/\s*\(.*?\)\s*$/, '')
  return {
    id: `forma:${id}:${alvo.linha}:${alvo.coluna}`,
    enunciado: `${titulo}: qual é a forma de ${alvo.linha}${p.colunas.length > 1 ? ` · ${alvo.coluna}` : ''}?`,
    opcoes: o, certa: alvo.forma, opcoesGrego: true,
  }
}

export function gerarAvaliacao(l: Licao): Pergunta[] {
  if (l.id === 'alfabeto') return avaliacaoAlfabeto()
  const perguntas: Pergunta[] = []
  // Formas: até 4, das tabelas que a lição ensina.
  const tabelas = unicos(l.gramatica.flatMap(g => g.paradigmas ?? []))
  for (const t of embaralhar(tabelas).slice(0, 4)) { const q = perguntaForma(t); if (q) perguntas.push(q) }
  // Vocabulário da lição (o "a aprender" primeiro), alternando os dois sentidos.
  const vocab = [...embaralhar(l.vocab.filter(v => v.aprender)), ...embaralhar(l.vocab.filter(v => !v.aprender))]
  for (const [i, v] of vocab.entries()) {
    if (perguntas.length >= TAMANHO) break
    const q = perguntaVocab(v, i % 2 ? 'pg' : 'gp')
    if (q) perguntas.push(q)
  }
  // Pouco material? Revisão das lições anteriores da trilha.
  if (perguntas.length < TAMANHO) {
    const i = passosTrilha.findIndex(p => p.licao.id === l.id)
    const anteriores = passosTrilha.slice(0, Math.max(0, i)).map(p => p.licao).filter(x => !x.especial)
    const vistas = new Set(vocab.map(v => chave(v.grego)))
    const revisao = embaralhar(anteriores.flatMap(a => a.vocab.filter(v => v.aprender && !vistas.has(chave(v.grego))).map(v => ({ v, a }))))
    for (const { v, a } of revisao) {
      if (perguntas.length >= TAMANHO) break
      const q = perguntaVocab(v, Math.random() < .5 ? 'gp' : 'pg', `revisão de ${a.rotulo}`)
      if (q && !perguntas.some(x => x.id === q.id)) perguntas.push(q)
    }
  }
  return embaralhar(perguntas).slice(0, TAMANHO)
}

// ---------------------------------------------------------------------------------------------
// Lição 0: 20 perguntas — letras (inclusive as que se confundem e o ς), leitura com transliteração,
// espíritos, acentos, sigma final e as regras de escrita.

export const TAMANHO_ALFABETO = 20

/** "Qual destas palavras tem X?": uma certa e três de outros grupos. */
const qualDestas = (id: string, enunciado: string, certas: string[], outras: string[]): Pergunta => {
  const certa = embaralhar(certas)[0]
  return { id, enunciado, opcoes: opcoes(certa, outras), certa, opcoesGrego: true }
}

/** Grafias erradas do sigma: troca σ por ς e vice-versa nas posições de sigma. */
function perguntaSigma(palavra: string): Pergunta {
  const pos = [...palavra].map((c, i) => (c === 'σ' || c === 'ς') ? i : -1).filter(i => i >= 0)
  const variantes = new Set<string>()
  for (let m = 1; m < 1 << pos.length; m++) {
    const cs = [...palavra]
    pos.forEach((p, k) => { if (m & (1 << k)) cs[p] = cs[p] === 'σ' ? 'ς' : 'σ' })
    variantes.add(cs.join(''))
  }
  // poucas variantes (uma só posição): acrescenta grafias com σ/ς em lugares impossíveis
  const extras = [`ς${palavra.slice(1)}`, palavra.replace(/ς$/, 'σ'), palavra.replace(/σ/, 'ς')]
  return {
    id: `sigma:${palavra}`, enunciado: 'Qual destas está escrita corretamente?',
    opcoes: opcoes(palavra, [...variantes, ...extras].filter(v => v !== palavra)), certa: palavra, opcoesGrego: true,
  }
}

const regra = (r: typeof REGRAS[number]): Pergunta => ({ id: `regra:${r.pergunta}`, enunciado: r.pergunta, opcoes: embaralhar([...r.opcoes]), certa: r.opcoes[0] })

function avaliacaoAlfabeto(): Pergunta[] {
  const nomePorForma = (f: string) => LETRAS.find(l => l.minuscula === f || l.maiuscula === f)!
  // 4 letras, metade delas das que se confundem; e o ς
  const formas = unicos([...embaralhar(LETRAS_TRAICOEIRAS).slice(0, 2), ...embaralhar(LETRAS).slice(0, 6).map(l => Math.random() < .5 ? l.maiuscula : l.minuscula)]).slice(0, 4)
  const letras: Pergunta[] = formas.map(f => {
    const l = nomePorForma(f)
    return { id: `letra:${f}`, enunciado: 'Que letra é esta?', destaque: f, destaqueGrego: true, opcoes: opcoes(l.nomePt, LETRAS.map(x => x.nomePt)), certa: l.nomePt }
  })
  const sigmaFinal: Pergunta = { id: 'letra:ς', enunciado: 'Que letra é esta?', destaque: 'ς', destaqueGrego: true,
    opcoes: embaralhar(['sigma, no fim da palavra', 'zeta', 'csi', 'gama']), certa: 'sigma, no fim da palavra' }
  const leituras: Pergunta[] = embaralhar(LEITURAS).slice(0, 4).map(p => ({
    id: `leitura:${p.grego}`, enunciado: 'Como se lê (transliteração)?', destaque: p.grego, destaqueGrego: true,
    opcoes: embaralhar([p.certa, ...p.erradas]), certa: p.certa,
  }))
  const espiritos = [
    qualDestas('espirito:aspero', 'Qual destas palavras tem espírito áspero (lê-se com h)?', ESPIRITO_ASPERO, embaralhar(ESPIRITO_BRANDO).slice(0, 3)),
    qualDestas('espirito:brando', 'Qual destas palavras tem espírito brando (sem h)?', ESPIRITO_BRANDO, embaralhar(ESPIRITO_ASPERO).slice(0, 3)),
  ]
  const acentos = [
    qualDestas('acento:circunflexo', 'Qual destas palavras tem acento circunflexo?', ACENTO_CIRCUNFLEXO,
      embaralhar([...ACENTO_AGUDO, ...ACENTO_GRAVE]).filter(x => !ACENTO_CIRCUNFLEXO.includes(x)).slice(0, 3)),
    qualDestas('acento:grave', 'Qual destas palavras tem acento grave?', ACENTO_GRAVE,
      embaralhar([...ACENTO_AGUDO, ...ACENTO_CIRCUNFLEXO]).slice(0, 3)),
    qualDestas('acento:agudo', 'Qual destas palavras tem acento agudo?', ACENTO_AGUDO.filter(x => !ESPIRITO_ASPERO.includes(x)),
      embaralhar([...ACENTO_CIRCUNFLEXO, ...ACENTO_GRAVE]).slice(0, 3)),
  ]
  const sigmas = embaralhar(COM_SIGMA).slice(0, 2).map(perguntaSigma)
  const regras = (['espíritos', 'acentos', 'escrita'] as const).map(t => regra(embaralhar(REGRAS.filter(r => r.tema === t))[0]))
  const palavra = embaralhar(PALAVRAS_LEITURA).slice(0, 1).map(p => ({
    id: `palavra:${p.grego}`, enunciado: 'Leia: que palavra portuguesa vem daqui?', destaque: p.grego, destaqueGrego: true,
    opcoes: opcoes(p.pt, PALAVRAS_LEITURA.map(x => x.pt)), certa: p.pt,
  }))
  // letras 4 + ς 1 + leitura 4 + espíritos 2 + acentos 3 + sigma 2 + regras 3 + palavra 1 = 20
  return embaralhar([...letras, sigmaFinal, ...leituras, ...espiritos, ...acentos, ...sigmas, ...regras, ...palavra])
}

/** Para o treino (sem nota): só espíritos, acentos, sigma e regras, sorteados de novo a cada vez. */
export function perguntaDeSinais(): Pergunta {
  const tipos = [
    () => qualDestas('t', 'Qual destas palavras tem espírito áspero (lê-se com h)?', ESPIRITO_ASPERO, embaralhar(ESPIRITO_BRANDO).slice(0, 3)),
    () => qualDestas('t', 'Qual destas palavras tem espírito brando (sem h)?', ESPIRITO_BRANDO, embaralhar(ESPIRITO_ASPERO).slice(0, 3)),
    () => qualDestas('t', 'Qual destas palavras tem acento circunflexo?', ACENTO_CIRCUNFLEXO, embaralhar([...ACENTO_AGUDO, ...ACENTO_GRAVE]).filter(x => !ACENTO_CIRCUNFLEXO.includes(x)).slice(0, 3)),
    () => qualDestas('t', 'Qual destas palavras tem acento grave?', ACENTO_GRAVE, embaralhar([...ACENTO_AGUDO, ...ACENTO_CIRCUNFLEXO]).slice(0, 3)),
    () => perguntaSigma(embaralhar(COM_SIGMA)[0]),
    () => regra(embaralhar(REGRAS)[0]),
    () => { const p = embaralhar(LEITURAS)[0]; return { id: 't', enunciado: 'Como se lê (transliteração)?', destaque: p.grego, destaqueGrego: true, opcoes: embaralhar([p.certa, ...p.erradas]), certa: p.certa } },
  ]
  return embaralhar(tipos)[0]()
}

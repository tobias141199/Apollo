// Gera a avaliação de uma lição: perguntas de múltipla escolha sobre o vocabulário da lição
// (grego → português e português → grego) e sobre as formas das tabelas que a lição ensina.
// Se a lição tiver pouco material, completa com revisão do vocabulário das lições anteriores.
import { paradigmaPorId, passosTrilha, vocabulario, type Licao } from '../content'
import type { Vocab } from '../content/schema'
import { LETRAS, PALAVRAS_LEITURA } from '../alfabeto/letras'
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

/** Lição 0: reconhecer as letras (6) e ler palavras (4). */
function avaliacaoAlfabeto(): Pergunta[] {
  const letras = embaralhar(LETRAS).slice(0, 6).map(l => {
    const maiuscula = Math.random() < .4
    return {
      id: `letra:${l.nome}`, enunciado: 'Que letra é esta?', destaque: maiuscula ? l.maiuscula : l.minuscula, destaqueGrego: true,
      opcoes: opcoes(l.nomePt, LETRAS.map(x => x.nomePt)), certa: l.nomePt,
    }
  })
  const palavras = embaralhar(PALAVRAS_LEITURA).slice(0, 4).map(p => ({
    id: `palavra:${p.grego}`, enunciado: 'Leia: que palavra portuguesa vem daqui?', destaque: p.grego, destaqueGrego: true,
    opcoes: opcoes(p.pt, PALAVRAS_LEITURA.map(x => x.pt)), certa: p.pt,
  }))
  return embaralhar([...letras, ...palavras])
}

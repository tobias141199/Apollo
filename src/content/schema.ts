// Schema do conteúdo. Todo arquivo em content/{public,private}/ é validado por estes tipos
// (ver schema.test.ts). Regra central: TODO item traz `fonte` dizendo de onde veio.
import { z } from 'zod'

/** Livros de referência. "original" = texto redigido para este projeto (pode ser público). */
export const Livro = z.enum([
  'JACT-Textos', // Aprendendo Grego — Textos e Vocabulário (Odysseus/Cambridge)
  'JACT-Gramatica', // Aprendendo Grego — Gramática e Exercícios (Odysseus/Cambridge)
  'Athenaze', // Balme & Lawall, Athenaze Book I, 2ª ed. (Oxford UP, 2003)
  'original',
])
export type Livro = z.infer<typeof Livro>

export const Fonte = z.object({
  livro: Livro,
  /** Página impressa no livro (não a página do PDF). */
  pagina: z.union([z.number().int(), z.string()]).optional(),
  /** Seção da JACT ("1A"), capítulo do Athenaze ("cap. 2") ou § da gramática ("§12"). */
  local: z.string().optional(),
  /** Linhas do texto, quando a citação for de um trecho narrativo ("l. 3–5"). */
  linhas: z.string().optional(),
})
export type Fonte = z.infer<typeof Fonte>

export const Classe = z.enum([
  'substantivo', 'verbo', 'adjetivo', 'artigo', 'pronome', 'advérbio',
  'preposição', 'conjunção', 'partícula', 'interjeição', 'numeral', 'nome próprio', 'expressão',
])

export const Vocab = z.object({
  /** Forma de citação (lema) em grego, Unicode NFC, com acentos. Ex.: "λόγος". */
  grego: z.string().min(1),
  /** Forma lexical completa como no "Vocabulário a ser aprendido". Ex.: "λόγος, ὁ (2a)". */
  lexical: z.string().optional(),
  classe: Classe,
  glosa: z.string().min(1),
  /**
   * true = palavra a aprender na lição: na JACT, está no "Vocabulário a ser aprendido";
   * no Athenaze, está no quadro "Vocabulary" do capítulo.
   */
  aprender: z.boolean().default(false),
  /** id de um paradigma em content/*\/paradigms (ex.: "decl2-masc"). */
  paradigma: z.string().optional(),
  /** Partes principais (verbos), quando já apresentadas. */
  partes: z.array(z.string()).optional(),
  /** Onde a palavra aparece no Athenaze (ex.: "cap. 1"), se aparecer até o ponto equivalente. */
  athenaze: z.string().optional(),
  nota: z.string().optional(),
  fonte: Fonte,
})
export type Vocab = z.infer<typeof Vocab>

export const Citacao = z.object({
  grego: z.string(),
  traducao: z.string().optional(),
  comentario: z.string().optional(),
  fonte: Fonte,
})
export type Citacao = z.infer<typeof Citacao>

export const Gramatica = z.object({
  topico: z.string(),
  /** Explicação curta redigida para o projeto (foco em leitura, não em teoria). */
  nota: z.string(),
  jact: Fonte.optional(),
  athenaze: Fonte.optional(),
  paradigmas: z.array(z.string()).optional(),
  exemplos: z.array(Citacao).optional(),
})
export type Gramatica = z.infer<typeof Gramatica>

export const Exercicio = z.object({
  id: z.string(),
  tipo: z.enum(['traduzir-gp', 'traduzir-pg', 'morfologia', 'completar', 'transformar', 'vocabulario', 'outro']),
  titulo: z.string(),
  enunciado: z.string(),
  itens: z.array(z.object({
    pergunta: z.string(),
    resposta: z.string().optional(),
  })),
  /** Quem escreveu as respostas: o livro (chave) ou o projeto (resposta sugerida). */
  gabarito: z.enum(['livro', 'projeto']).optional(),
  fonte: Fonte,
})
export type Exercicio = z.infer<typeof Exercicio>

/** Um bloco de texto narrativo (ex.: o texto grego de 1A). Só no pacote privado, salvo frases curtas. */
export const Trecho = z.object({
  titulo: z.string().optional(),
  grego: z.string(),
  fonte: Fonte,
})

export const Secao = z.object({
  /** "1A", "1B", … "7H". */
  id: z.string().regex(/^\d{1,2}[A-J]$/),
  secao: z.number().int(), // 1..7
  parte: z.number().int(), // 1..2
  titulo: z.string().optional(),
  resumo: z.string().optional(),
  fonte: Fonte.optional(),
  vocab: z.array(Vocab).default([]),
  gramatica: z.array(Gramatica).default([]),
  exercicios: z.array(Exercicio).default([]),
  textos: z.array(Trecho).default([]),
  /** Simbiose JACT × Athenaze para esta subseção. */
  athenaze: z.object({
    capitulos: z.array(z.string()).default([]),
    comparacao: z.string().optional(),
    complementos: z.array(z.string()).default([]),
    citacoes: z.array(Citacao).default([]),
  }).optional(),
})
export type Secao = z.infer<typeof Secao>
export type SecaoInput = z.input<typeof Secao>

/**
 * Ponte de uma lição de um livro para as lições correspondentes do outro.
 * `correspondentes` são ids de lição: "1A" (JACT) ou "ath3" (Athenaze).
 */
export const Ponte = z.object({
  correspondentes: z.array(z.string()).default([]),
  comparacao: z.string().optional(),
  complementos: z.array(z.string()).default([]),
  citacoes: z.array(Citacao).default([]),
})
export type Ponte = z.infer<typeof Ponte>

/** Um capítulo do Athenaze Book I (1–16). Espelha `Secao` para reaproveitar a mesma página. */
export const Capitulo = z.object({
  /** "ath1" … "ath16". */
  id: z.string().regex(/^ath([1-9]|1[0-6])$/),
  capitulo: z.number().int().min(1).max(16),
  /** Título do capítulo no livro, em grego (ex.: "Ὁ Δικαιόπολις"). */
  tituloGrego: z.string().optional(),
  /** Título curto nosso, em português. */
  titulo: z.string().optional(),
  resumo: z.string().optional(),
  fonte: Fonte.optional(),
  vocab: z.array(Vocab).default([]),
  gramatica: z.array(Gramatica).default([]),
  exercicios: z.array(Exercicio).default([]),
  /** Leituras α e β do capítulo (completas só no privado). */
  textos: z.array(Trecho).default([]),
  /** Resumo nosso do ensaio cultural do capítulo. */
  cultura: z.object({ titulo: z.string(), resumo: z.string(), fonte: Fonte }).optional(),
  /** Ponte para as seções da JACT. */
  jact: Ponte.optional(),
})
export type Capitulo = z.infer<typeof Capitulo>

/** Trilha única de estudo: seções da JACT e capítulos do Athenaze intercalados. */
export const Trilha = z.object({
  etapas: z.array(z.object({
    titulo: z.string(),
    nota: z.string().optional(),
    passos: z.array(z.object({
      /** id da lição: "1A" ou "ath1". */
      licao: z.string().regex(/^(\d{1,2}[A-J]|ath([1-9]|1[0-6]))$/),
      /** Por que este passo vem aqui (texto nosso, curto). */
      porque: z.string().optional(),
    })),
  })),
})
export type Trilha = z.infer<typeof Trilha>

/** Tabela de paradigma. Cada célula é uma forma grega; `term` marca a terminação a destacar. */
export const Paradigma = z.object({
  id: z.string(),
  titulo: z.string(),
  grupo: z.enum(['artigo', 'substantivo', 'adjetivo', 'pronome', 'verbo']),
  /** Cabeçalhos das colunas (ex.: ["Masc.", "Fem.", "Neut."]). */
  colunas: z.array(z.string()),
  linhas: z.array(z.object({
    rotulo: z.string(), // "Nom. sg."
    /** Cada célula: forma completa; use "|" para separar tema|terminação (ex.: "λόγ|ος"). */
    celulas: z.array(z.string()),
  })),
  nota: z.string().optional(),
  jact: Fonte.optional(),
  athenaze: Fonte.optional(),
})
export type Paradigma = z.infer<typeof Paradigma>

export const Concordancia = z.array(z.object({
  jact: z.string(), // "1A–B"
  athenaze: z.array(z.string()), // ["cap. 1", "cap. 2 Gram. 1"]
  topicos: z.array(z.string()),
  nota: z.string().optional(),
}))
export type Concordancia = z.infer<typeof Concordancia>

/**
 * Imagens dos flashcards (content/public/imagens.json). O crédito e a licença fazem o papel da
 * `fonte`. Arquivos em public/imagens/. As imagens podem ser trocadas no próprio app (editor do
 * `npm run dev`, ver vite.config.ts); as enviadas à mão podem ter licença "não informada".
 */
export const Licenca = z.enum(['não informada', 'CC0', 'Domínio público', 'CC BY 2.0', 'CC BY 2.5', 'CC BY 3.0', 'CC BY 4.0',
  'CC BY-SA 2.0', 'CC BY-SA 2.5', 'CC BY-SA 3.0', 'CC BY-SA 4.0'])
export const Imagem = z.object({
  /** Nome do arquivo em public/imagens/ (WebP). */
  arquivo: z.string().regex(/^[a-z0-9-]+\.webp$/),
  /** Nome da obra, em português ("Ânfora ática de figuras negras"). */
  titulo: z.string().min(1),
  /** Por que a imagem lembra a(s) palavra(s): texto nosso, curto. */
  descricao: z.string().optional(),
  /** Pintor, escultor ou fotógrafo. */
  autor: z.string().optional(),
  data: z.string().optional(),
  /** Museu e número de inventário, ou o lugar fotografado. */
  acervo: z.string().optional(),
  licenca: Licenca,
  /** Página de origem (Wikimedia Commons, Met, Art Institute of Chicago…). */
  url: z.string().url().optional(),
  /** Endereço da imagem baixada (usado por scripts/imagens/baixar.mjs). Imagens enviadas pelo editor não têm. */
  origem: z.string().url().optional(),
  /** Recorte para o cartão: posição de `object-position` ("50% 30%"). */
  foco: z.string().optional(),
})
export type Imagem = z.infer<typeof Imagem>
export const CatalogoImagens = z.object({
  imagens: z.record(z.string().regex(/^[a-z0-9-]+$/), Imagem),
  /** chave() do lema → id da imagem. Uma imagem pode servir a várias palavras. */
  palavras: z.record(z.string(), z.string()),
})
export type CatalogoImagens = z.infer<typeof CatalogoImagens>

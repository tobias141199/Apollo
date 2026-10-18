// Catálogo das tabelas (paradigmas), organizado como numa gramática: classe de palavra → subgrupo.
// Dentro de cada subgrupo, as tabelas seguem a ordem em que a trilha as apresenta.
// Tabela nova em content/public/paradigms/? Acrescente o id no subgrupo certo aqui
// (uma tabela fora do catálogo aparece em "Outras").
import { paradigmaPorId, paradigmas, passosTrilha, type Licao } from './index'

export interface Subgrupo { titulo: string; ids: string[] }
export interface Categoria { titulo: string; descricao: string; subgrupos: Subgrupo[] }

const CATALOGO: Categoria[] = [
  { titulo: 'Artigo', descricao: 'O artigo definido, que acompanha os substantivos e mostra gênero, número e caso.', subgrupos: [
    { titulo: 'Artigo definido', ids: ['artigo'] },
  ] },
  { titulo: 'Substantivos', descricao: 'As três declinações. O número entre parênteses (1a, 2b, 3c…) é o tipo usado nos vocabulários da JACT.', subgrupos: [
    { titulo: '1ª declinação', ids: ['decl1-a', 'decl1-b', 'decl1-c', 'decl1-d'] },
    { titulo: '2ª declinação', ids: ['decl2-masc', 'decl2-neut'] },
    { titulo: '3ª declinação', ids: ['decl3-a', 'decl3-a-dental', 'aner-pater', 'decl3-b', 'decl3-c', 'decl3-d', 'polis-asty', 'decl3-g'] },
    { titulo: 'Irregulares', ids: ['gyne', 'naus'] },
  ] },
  { titulo: 'Adjetivos', descricao: 'Concordam com o substantivo; os de 1ª/2ª declinação seguem o modelo de καλός.', subgrupos: [
    { titulo: '1ª e 2ª declinação', ids: ['adj-kalos', 'adj-hemeteros'] },
    { titulo: '3ª declinação', ids: ['adj-alethes'] },
    { titulo: 'Irregulares', ids: ['adj-megas', 'adj-polys', 'adj-pas'] },
    { titulo: 'Numerais', ids: ['eis-oudeis'] },
  ] },
  { titulo: 'Pronomes', descricao: 'Pessoais, αὐτός, demonstrativos e o interrogativo/indefinido.', subgrupos: [
    { titulo: 'Pessoais', ids: ['pron-pessoais'] },
    { titulo: 'αὐτός', ids: ['autos'] },
    { titulo: 'Demonstrativos', ids: ['houtos', 'ekeinos'] },
    { titulo: 'Interrogativo e indefinido', ids: ['tis-tis'] },
  ] },
  { titulo: 'Verbos', descricao: 'Organizados por tempo e modo, na ordem em que aparecem nos livros.', subgrupos: [
    { titulo: 'εἰμί', ids: ['eimi'] },
    { titulo: 'Presente', ids: ['verbo-presente-ativo', 'verbo-presente-medio', 'poieo-presente', 'orao-presente'] },
    { titulo: 'Imperativo e infinitivo', ids: ['verbo-imperativo', 'infinitivos'] },
    { titulo: 'Imperfeito e futuro', ids: ['verbo-imperfeito', 'verbo-futuro'] },
    { titulo: 'Aoristo', ids: ['verbo-aoristo-fraco', 'verbo-aoristo-forte'] },
    { titulo: 'Particípios', ids: ['part-on', 'part-presente-ativo', 'part-medio', 'part-aoristo-fraco', 'part-aoristo-forte'] },
  ] },
]

/** Comparações prontas, para quem não sabe por onde começar. */
export const COMPARACOES: { titulo: string; ids: string[] }[] = [
  { titulo: 'Artigo + 1ª e 2ª declinação', ids: ['artigo', 'decl1-a', 'decl2-masc', 'decl2-neut'] },
  { titulo: 'Os tipos da 1ª declinação', ids: ['decl1-a', 'decl1-b', 'decl1-c', 'decl1-d'] },
  { titulo: 'Presente: ativo × médio', ids: ['verbo-presente-ativo', 'verbo-presente-medio'] },
  { titulo: 'Contratos: -έω × -άω', ids: ['verbo-presente-ativo', 'poieo-presente', 'orao-presente'] },
  { titulo: 'Imperfeito, futuro e aoristo', ids: ['verbo-imperfeito', 'verbo-futuro', 'verbo-aoristo-fraco', 'verbo-aoristo-forte'] },
  { titulo: 'Os particípios', ids: ['part-presente-ativo', 'part-medio', 'part-aoristo-fraco', 'part-aoristo-forte'] },
  { titulo: 'Demonstrativos', ids: ['artigo', 'houtos', 'ekeinos', 'autos'] },
]

/** Primeira lição da trilha que ensina a tabela (na gramática; senão, no vocabulário). */
export const primeiraLicao: Map<string, Licao> = (() => {
  const m = new Map<string, Licao>()
  for (const usarVocab of [false, true]) for (const { licao } of passosTrilha) {
    const ids = usarVocab ? licao.vocab.map(v => v.paradigma) : licao.gramatica.flatMap(g => g.paradigmas ?? [])
    for (const id of ids) if (id && !m.has(id)) m.set(id, licao)
  }
  return m
})()

const posicao = (id: string) => {
  const l = primeiraLicao.get(id)
  const i = l ? passosTrilha.findIndex(p => p.licao.id === l.id) : -1
  return i < 0 ? Infinity : i
}

/** O catálogo pronto: só tabelas que existem, cada subgrupo na ordem da trilha, e "Outras" no fim. */
export const catalogo: Categoria[] = (() => {
  const usados = new Set(CATALOGO.flatMap(c => c.subgrupos.flatMap(s => s.ids)))
  const resto = paradigmas.map(p => p.id).filter(id => !usados.has(id))
  return [...CATALOGO, ...(resto.length ? [{ titulo: 'Outras', descricao: '', subgrupos: [{ titulo: 'Outras tabelas', ids: resto }] }] : [])]
    .map(c => ({ ...c, subgrupos: c.subgrupos.map(s => ({ ...s, ids: s.ids.filter(id => paradigmaPorId.has(id)).sort((a, b) => posicao(a) - posicao(b)) })).filter(s => s.ids.length) }))
    .filter(c => c.subgrupos.length)
})()

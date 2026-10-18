import type { Fonte } from '../content/schema'

const NOMES: Record<Fonte['livro'], string> = {
  'JACT-Textos': 'JACT · Textos',
  'JACT-Gramatica': 'JACT · Gramática',
  Athenaze: 'Athenaze',
  original: 'Nota do projeto',
}

/** Etiqueta discreta de origem: "JACT · Textos · 1A · p. 6". */
export function FonteTag({ fonte }: { fonte?: Fonte }) {
  if (!fonte) return null
  const partes = [NOMES[fonte.livro], fonte.local, fonte.pagina != null ? `p. ${fonte.pagina}` : null, fonte.linhas]
  return <span className={`fonte fonte-${fonte.livro.toLowerCase()}`}>{partes.filter(Boolean).join(' · ')}</span>
}

// O alfabeto grego para a Lição 0: nomes, pronúncia (texto nosso, em português) e o traçado das
// minúsculas à mão, com a ordem e a direção de cada traço.
//
// O traçado segue as convenções do Athenaze (Introdução, Part III, "Writing Greek Letters",
// p. xvi–xix): onde começar cada letra (S₁, S₂…), para que lado mover a caneta e os quatro grupos
// de altura. Os desenhos são nossos (caminhos SVG), não cópia das figuras do livro.
//
// Pauta de cada letra: largura 100; y = 0 (topo das altas), 40 (topo das baixas),
// 80 (linha de base), 120 (fim das que descem).

export interface Letra {
  maiuscula: string
  minuscula: string
  /** Outra forma da minúscula (σ / ς). */
  variante?: string
  nome: string        // nome em grego
  nomePt: string      // como chamamos em português
  translit: string
  /** Pronúncia aproximada, para falantes de português (texto nosso). */
  som: string
  /** Grupo de altura do Athenaze: 1 = só entre as linhas do meio; 2 = sobe; 3 = desce; 4 = sobe e desce. */
  grupo: 1 | 2 | 3 | 4
  /** Traços da minúscula, na ordem em que se escrevem (caminhos SVG na pauta 100 × 120). */
  tracos: string[]
  /** Traços da variante (ς). */
  tracosVariante?: string[]
}

export const LETRAS: Letra[] = [
  { maiuscula: 'Α', minuscula: 'α', nome: 'ἄλφα', nomePt: 'alfa', translit: 'a', grupo: 1,
    som: 'a, como em “pá”. Pode ser breve ou longo (o longo dura o dobro).',
    tracos: ['M74 44 C 64 56, 54 79, 38 79 C 23 79, 17 67, 19 57 C 22 45, 33 40, 43 44 C 55 50, 63 71, 78 80'] },
  { maiuscula: 'Β', minuscula: 'β', nome: 'βῆτα', nomePt: 'beta', translit: 'b', grupo: 4,
    som: 'b, como em “bola”.',
    tracos: ['M34 118 L 34 24 C 34 8, 43 2, 53 2 C 64 2, 69 11, 67 21 C 65 31, 56 37, 45 38 C 61 38, 73 48, 71 62 C 69 75, 58 81, 48 80 C 41 79, 36 75, 34 69'] },
  { maiuscula: 'Γ', minuscula: 'γ', nome: 'γάμμα', nomePt: 'gama', translit: 'g', grupo: 3,
    som: 'g, sempre como em “gato”. Antes de γ, κ, ξ, χ soa como o n de “manga” (ἄγγελος = ánguelos).',
    tracos: ['M26 42 C 37 47, 46 68, 51 90 C 56 108, 49 120, 42 117 C 34 113, 40 97, 50 84 C 58 70, 66 54, 75 42'] },
  { maiuscula: 'Δ', minuscula: 'δ', nome: 'δέλτα', nomePt: 'delta', translit: 'd', grupo: 2,
    som: 'd, como em “dado” (nunca “dj”).',
    tracos: ['M66 6 C 56 0, 36 1, 35 13 C 34 25, 60 32, 66 50 C 71 67, 62 80, 49 80 C 35 80, 28 69, 30 58 C 32 48, 43 42, 56 42'] },
  { maiuscula: 'Ε', minuscula: 'ε', nome: 'ἒ ψιλόν', nomePt: 'épsilon', translit: 'e', grupo: 1,
    som: 'e breve e aberto, como em “pé”, mas curto.',
    tracos: ['M67 47 C 60 40, 38 39, 36 49 C 34 57, 44 60, 53 60 C 39 60, 29 64, 30 72 C 32 82, 56 82, 68 74'] },
  { maiuscula: 'Ζ', minuscula: 'ζ', nome: 'ζῆτα', nomePt: 'zeta', translit: 'z', grupo: 4,
    som: 'zd, como em “Mazda” (ζ = σ + δ).',
    tracos: ['M33 6 C 43 10, 58 8, 67 4 C 50 18, 30 36, 30 56 C 30 72, 44 80, 58 82 C 69 84, 69 96, 61 104 C 57 108, 53 107, 50 104'] },
  { maiuscula: 'Η', minuscula: 'η', nome: 'ἦτα', nomePt: 'eta', translit: 'ē', grupo: 3,
    som: 'é longo e aberto, como em “pé”, mas prolongado.',
    tracos: ['M24 48 C 28 40, 37 41, 37 51 L 37 80 L 37 58 C 41 46, 50 41, 59 41 C 69 41, 72 49, 72 58 L 72 118'] },
  { maiuscula: 'Θ', minuscula: 'θ', nome: 'θῆτα', nomePt: 'teta', translit: 'th', grupo: 2,
    som: 't aspirado: um t seguido de um sopro (como o t do inglês “top”). Mais tarde virou o th de “think”.',
    tracos: ['M38 36 C 28 62, 35 80, 50 80 C 65 80, 72 60, 70 36 C 68 13, 60 2, 50 2 C 38 2, 32 16, 36 28 C 40 40, 57 42, 77 34'] },
  { maiuscula: 'Ι', minuscula: 'ι', nome: 'ἰῶτα', nomePt: 'iota', translit: 'i', grupo: 1,
    som: 'i, como em “vi”. Pode ser breve ou longo.',
    tracos: ['M49 42 L 49 72 C 49 80, 55 81, 61 77'] },
  { maiuscula: 'Κ', minuscula: 'κ', nome: 'κάππα', nomePt: 'capa', translit: 'k', grupo: 1,
    som: 'k, como o c de “casa” (sem sopro).',
    tracos: ['M35 42 L 29 80', 'M68 42 L 32 62 L 67 80'] },
  { maiuscula: 'Λ', minuscula: 'λ', nome: 'λάμβδα', nomePt: 'lambda', translit: 'l', grupo: 2,
    som: 'l, como em “lata” (nunca “u” no fim da sílaba).',
    tracos: ['M34 2 C 43 6, 50 20, 54 34 L 71 80', 'M53 34 L 29 80'] },
  { maiuscula: 'Μ', minuscula: 'μ', nome: 'μῦ', nomePt: 'mi', translit: 'm', grupo: 3,
    som: 'm, como em “mão”.',
    tracos: ['M35 42 L 29 118', 'M34 64 C 36 77, 46 81, 54 79 C 64 77, 67 64, 67 42 L 67 73 C 67 80, 72 81, 77 78'] },
  { maiuscula: 'Ν', minuscula: 'ν', nome: 'νῦ', nomePt: 'ni', translit: 'n', grupo: 1,
    som: 'n, como em “nó”. Atenção: ν tem ponta embaixo; υ é redondo.',
    tracos: ['M31 42 C 35 58, 40 72, 46 80 C 56 67, 64 53, 73 40'] },
  { maiuscula: 'Ξ', minuscula: 'ξ', nome: 'ξῖ', nomePt: 'csi', translit: 'x', grupo: 4,
    som: 'ks, como o x de “táxi” (ξ = κ + σ).',
    tracos: ['M36 3 C 44 8, 58 8, 66 3 C 48 6, 35 13, 37 24 C 39 34, 51 38, 62 38 C 44 39, 30 47, 32 61 C 34 74, 48 80, 60 82 C 70 84, 69 96, 61 104 C 57 108, 53 107, 50 104'] },
  { maiuscula: 'Ο', minuscula: 'ο', nome: 'ὂ μικρόν', nomePt: 'ômicron', translit: 'o', grupo: 1,
    som: 'o breve e fechado, como em “ovo”, mas curto. (“o pequeno”, em oposição a ω, “o grande”.)',
    tracos: ['M52 40 C 35 40, 27 52, 28 63 C 29 75, 39 80, 51 80 C 65 80, 73 69, 72 57 C 71 46, 63 40, 52 40'] },
  { maiuscula: 'Π', minuscula: 'π', nome: 'πῖ', nomePt: 'pi', translit: 'p', grupo: 1,
    som: 'p, como em “pato” (sem sopro).',
    tracos: ['M37 47 C 37 61, 35 72, 30 80', 'M63 47 L 63 73 C 63 80, 69 81, 74 77', 'M21 51 C 23 45, 29 44, 37 45 L 81 45'] },
  { maiuscula: 'Ρ', minuscula: 'ρ', nome: 'ῥῶ', nomePt: 'rô', translit: 'r', grupo: 3,
    som: 'r vibrante, como em “caro” (e no começo da palavra, levemente soprado: ῥ = rh).',
    tracos: ['M34 118 L 34 62 C 34 49, 42 42, 52 42 C 64 42, 70 52, 70 62 C 70 74, 62 80, 52 80 C 44 80, 38 76, 34 70'] },
  { maiuscula: 'Σ', minuscula: 'σ', variante: 'ς', nome: 'σίγμα', nomePt: 'sigma', translit: 's', grupo: 1,
    som: 's de “sapo”, nunca z (só antes de β, γ, δ, μ soa z). No fim da palavra escreve-se ς: λόγος.',
    tracos: ['M80 42 L 52 42 C 35 42, 27 53, 28 64 C 29 75, 39 80, 51 80 C 65 80, 72 69, 70 58 C 68 48, 60 42, 52 42'],
    tracosVariante: ['M73 44 C 63 40, 41 40, 33 50 C 25 62, 34 76, 50 82 C 62 86, 64 98, 57 106 C 53 110, 49 109, 46 106'] },
  { maiuscula: 'Τ', minuscula: 'τ', nome: 'ταῦ', nomePt: 'tau', translit: 't', grupo: 1,
    som: 't, como em “tatu” (sem sopro, nunca “tch”).',
    tracos: ['M52 45 L 52 72 C 52 80, 58 81, 64 77', 'M28 45 L 76 45'] },
  { maiuscula: 'Υ', minuscula: 'υ', nome: 'ὖ ψιλόν', nomePt: 'ípsilon', translit: 'y (u)', grupo: 1,
    som: 'ü: lábios de “u” e língua de “i”, como o u do francês “tu”.',
    tracos: ['M30 42 C 30 60, 32 80, 50 80 C 66 80, 72 62, 72 42'] },
  { maiuscula: 'Φ', minuscula: 'φ', nome: 'φῖ', nomePt: 'fi', translit: 'ph', grupo: 3,
    som: 'p aspirado: p seguido de sopro. Mais tarde virou f, como em “filosofia”.',
    tracos: ['M41 44 C 28 48, 24 66, 34 75 C 42 82, 60 82, 68 72 C 76 62, 72 44, 60 42 C 52 41, 50 50, 50 60 L 48 118'] },
  { maiuscula: 'Χ', minuscula: 'χ', nome: 'χῖ', nomePt: 'qui', translit: 'ch', grupo: 3,
    som: 'k aspirado: k seguido de sopro. Mais tarde virou o “rr” forte, como em “carro” (pronúncia carioca).',
    tracos: ['M27 42 C 40 60, 56 96, 75 118', 'M75 42 L 27 118'] },
  { maiuscula: 'Ψ', minuscula: 'ψ', nome: 'ψῖ', nomePt: 'psi', translit: 'ps', grupo: 4,
    som: 'ps, como em “lapso” (ψ = π + σ).',
    tracos: ['M27 44 C 29 62, 33 80, 50 80 C 67 80, 73 62, 75 42', 'M55 4 L 46 118'] },
  { maiuscula: 'Ω', minuscula: 'ω', nome: 'ὦ μέγα', nomePt: 'ômega', translit: 'ō', grupo: 1,
    som: 'ó longo e aberto, como em “avó”, mas prolongado. (“o grande”.)',
    tracos: ['M33 44 C 25 52, 23 76, 37 80 C 46 82, 50 74, 51 63 C 52 74, 56 82, 65 80 C 79 76, 77 52, 69 44'] },
]

/** Os quatro grupos de altura do Athenaze (p. xvi–xix), com a explicação em português. */
export const GRUPOS: Record<Letra['grupo'], { titulo: string; texto: string }> = {
  1: { titulo: 'Letras baixas', texto: 'Ficam entre as duas linhas do meio, mais ou menos tão largas quanto altas, como o a e o c do nosso alfabeto.' },
  2: { titulo: 'Letras que sobem', texto: 'Apoiam-se na linha de base, mas têm o dobro da altura das baixas.' },
  3: { titulo: 'Letras que descem', texto: 'Começam na altura das baixas e descem abaixo da linha de base.' },
  4: { titulo: 'Letras que sobem e descem', texto: 'Ocupam a pauta inteira: sobem acima das baixas e descem abaixo da linha.' },
}

/** Palavras gregas que viraram palavras portuguesas (seleção nossa), para treinar a leitura. */
export const PALAVRAS_LEITURA: { grego: string; pt: string }[] = [
  { grego: 'δρᾶμα', pt: 'drama' }, { grego: 'θέμα', pt: 'tema' }, { grego: 'σχῆμα', pt: 'esquema' },
  { grego: 'πρόβλημα', pt: 'problema' }, { grego: 'σύστημα', pt: 'sistema' }, { grego: 'κλίμα', pt: 'clima' },
  { grego: 'ποίημα', pt: 'poema' }, { grego: 'δόγμα', pt: 'dogma' }, { grego: 'ἄρωμα', pt: 'aroma' },
  { grego: 'δίλημμα', pt: 'dilema' }, { grego: 'δίπλωμα', pt: 'diploma' }, { grego: 'θεώρημα', pt: 'teorema' },
  { grego: 'ἄσθμα', pt: 'asma' }, { grego: 'χάος', pt: 'caos' }, { grego: 'κόσμος', pt: 'cosmo' },
  { grego: 'φιλοσοφία', pt: 'filosofia' }, { grego: 'δημοκρατία', pt: 'democracia' }, { grego: 'μουσική', pt: 'música' },
  { grego: 'θέατρον', pt: 'teatro' }, { grego: 'ἱστορία', pt: 'história' }, { grego: 'γεωγραφία', pt: 'geografia' },
  { grego: 'ψυχή', pt: 'psique' }, { grego: 'ξένος', pt: 'xenofobia' }, { grego: 'Ζεύς', pt: 'Zeus' },
  { grego: 'Ἀθηνᾶ', pt: 'Atena' }, { grego: 'Ἀπόλλων', pt: 'Apolo' }, { grego: 'Ἑρμῆς', pt: 'Hermes' },
  { grego: 'Ἀφροδίτη', pt: 'Afrodite' },
]

// O alfabeto grego para a Lição 0: nomes, pronúncia (texto nosso, em português) e o traçado das
// maiúsculas e das minúsculas à mão, com a ordem e a direção de cada traço.
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
  /** Traços da maiúscula, na mesma pauta: vão do topo (y = 0) até a linha de base (y = 80). */
  tracosMaiuscula: string[]
  /** Traços da variante (ς). */
  tracosVariante?: string[]
}

export const LETRAS: Letra[] = [
  { maiuscula: 'Α', minuscula: 'α', nome: 'ἄλφα', nomePt: 'alfa', translit: 'a', grupo: 1,
    som: 'a, como em “pá”. Pode ser breve ou longo (o longo dura o dobro).',
    tracosMaiuscula: ['M50 2 L22 80', 'M50 2 L78 80', 'M33 52 L67 52'],
    tracos: ['M74 44 C 64 56, 54 79, 38 79 C 23 79, 17 67, 19 57 C 22 45, 33 40, 43 44 C 55 50, 63 71, 78 80'] },
  { maiuscula: 'Β', minuscula: 'β', nome: 'βῆτα', nomePt: 'beta', translit: 'b', grupo: 4,
    som: 'b, como em “bola”.',
    tracosMaiuscula: ['M30 2 L30 80', 'M30 2 L55 2 C69 2, 74 11, 74 20 C74 31, 66 39, 53 39 L30 39', 'M30 39 L57 39 C72 39, 78 48, 78 59 C78 72, 69 80, 56 80 L30 80'],
    tracos: ['M34 118 L 34 24 C 34 8, 43 2, 53 2 C 64 2, 69 11, 67 21 C 65 31, 56 37, 45 38 C 61 38, 73 48, 71 62 C 69 75, 58 81, 48 80 C 41 79, 36 75, 34 69'] },
  { maiuscula: 'Γ', minuscula: 'γ', nome: 'γάμμα', nomePt: 'gama', translit: 'g', grupo: 3,
    som: 'g, sempre como em “gato”. Antes de γ, κ, ξ, χ soa como o n de “manga” (ἄγγελος = ánguelos).',
    tracosMaiuscula: ['M30 2 L30 80', 'M30 2 L74 2'],
    tracos: ['M26 42 C 37 47, 46 68, 51 90 C 56 108, 49 120, 42 117 C 34 113, 40 97, 50 84 C 58 70, 66 54, 75 42'] },
  { maiuscula: 'Δ', minuscula: 'δ', nome: 'δέλτα', nomePt: 'delta', translit: 'd', grupo: 2,
    som: 'd, como em “dado” (nunca “dj”).',
    tracosMaiuscula: ['M50 2 L20 80', 'M50 2 L80 80', 'M20 80 L80 80'],
    tracos: ['M66 6 C 56 0, 36 1, 35 13 C 34 25, 60 32, 66 50 C 71 67, 62 80, 49 80 C 35 80, 28 69, 30 58 C 32 48, 43 42, 56 42'] },
  { maiuscula: 'Ε', minuscula: 'ε', nome: 'ἒ ψιλόν', nomePt: 'épsilon', translit: 'e', grupo: 1,
    som: 'e breve e aberto, como em “pé”, mas curto.',
    tracosMaiuscula: ['M30 2 L30 80', 'M30 2 L72 2', 'M30 40 L64 40', 'M30 80 L74 80'],
    tracos: ['M67 47 C 60 40, 38 39, 36 49 C 34 57, 44 60, 53 60 C 39 60, 29 64, 30 72 C 32 82, 56 82, 68 74'] },
  { maiuscula: 'Ζ', minuscula: 'ζ', nome: 'ζῆτα', nomePt: 'zeta', translit: 'z', grupo: 4,
    som: 'zd, como em “Mazda” (ζ = σ + δ).',
    tracosMaiuscula: ['M26 2 L74 2 L26 80 L76 80'],
    tracos: ['M33 6 C 43 10, 58 8, 67 4 C 50 18, 30 36, 30 56 C 30 72, 44 80, 58 82 C 69 84, 69 96, 61 104 C 57 108, 53 107, 50 104'] },
  { maiuscula: 'Η', minuscula: 'η', nome: 'ἦτα', nomePt: 'eta', translit: 'ē', grupo: 3,
    som: 'é longo e aberto, como em “pé”, mas prolongado.',
    tracosMaiuscula: ['M28 2 L28 80', 'M72 2 L72 80', 'M28 40 L72 40'],
    tracos: ['M24 48 C 28 40, 37 41, 37 51 L 37 80 L 37 58 C 41 46, 50 41, 59 41 C 69 41, 72 49, 72 58 L 72 118'] },
  { maiuscula: 'Θ', minuscula: 'θ', nome: 'θῆτα', nomePt: 'teta', translit: 'th', grupo: 2,
    som: 't aspirado: um t seguido de um sopro (como o t do inglês “top”). Mais tarde virou o th de “think”.',
    tracosMaiuscula: ['M50 2 C29 2, 18 21, 18 41 C18 62, 30 80, 50 80 C70 80, 82 62, 82 41 C82 21, 71 2, 50 2', 'M36 41 L64 41'],
    tracos: ['M38 36 C 28 62, 35 80, 50 80 C 65 80, 72 60, 70 36 C 68 13, 60 2, 50 2 C 38 2, 32 16, 36 28 C 40 40, 57 42, 77 34'] },
  { maiuscula: 'Ι', minuscula: 'ι', nome: 'ἰῶτα', nomePt: 'iota', translit: 'i', grupo: 1,
    som: 'i, como em “vi”. Pode ser breve ou longo.',
    tracosMaiuscula: ['M50 2 L50 80'],
    tracos: ['M49 42 L 49 72 C 49 80, 55 81, 61 77'] },
  { maiuscula: 'Κ', minuscula: 'κ', nome: 'κάππα', nomePt: 'capa', translit: 'k', grupo: 1,
    som: 'k, como o c de “casa” (sem sopro).',
    tracosMaiuscula: ['M30 2 L30 80', 'M74 2 L30 50', 'M43 38 L76 80'],
    tracos: ['M35 42 L 29 80', 'M68 42 L 32 62 L 67 80'] },
  { maiuscula: 'Λ', minuscula: 'λ', nome: 'λάμβδα', nomePt: 'lambda', translit: 'l', grupo: 2,
    som: 'l, como em “lata” (nunca “u” no fim da sílaba).',
    tracosMaiuscula: ['M50 2 L22 80', 'M50 2 L78 80'],
    tracos: ['M34 2 C 43 6, 50 20, 54 34 L 71 80', 'M53 34 L 29 80'] },
  { maiuscula: 'Μ', minuscula: 'μ', nome: 'μῦ', nomePt: 'mi', translit: 'm', grupo: 3,
    som: 'm, como em “mão”.',
    tracosMaiuscula: ['M20 80 L20 2', 'M20 2 L50 62 L80 2', 'M80 2 L80 80'],
    tracos: ['M35 42 L 29 118', 'M34 64 C 36 77, 46 81, 54 79 C 64 77, 67 64, 67 42 L 67 73 C 67 80, 72 81, 77 78'] },
  { maiuscula: 'Ν', minuscula: 'ν', nome: 'νῦ', nomePt: 'ni', translit: 'n', grupo: 1,
    som: 'n, como em “nó”. Atenção: ν tem ponta embaixo; υ é redondo.',
    tracosMaiuscula: ['M26 80 L26 2', 'M26 2 L74 80', 'M74 80 L74 2'],
    tracos: ['M31 42 C 35 58, 40 72, 46 80 C 56 67, 64 53, 73 40'] },
  { maiuscula: 'Ξ', minuscula: 'ξ', nome: 'ξῖ', nomePt: 'csi', translit: 'x', grupo: 4,
    som: 'ks, como o x de “táxi” (ξ = κ + σ).',
    tracosMaiuscula: ['M24 2 L76 2', 'M32 40 L68 40', 'M22 80 L78 80'],
    tracos: ['M36 3 C 44 8, 58 8, 66 3 C 48 6, 35 13, 37 24 C 39 34, 51 38, 62 38 C 44 39, 30 47, 32 61 C 34 74, 48 80, 60 82 C 70 84, 69 96, 61 104 C 57 108, 53 107, 50 104'] },
  { maiuscula: 'Ο', minuscula: 'ο', nome: 'ὂ μικρόν', nomePt: 'ômicron', translit: 'o', grupo: 1,
    som: 'o breve e fechado, como em “ovo”, mas curto. (“o pequeno”, em oposição a ω, “o grande”.)',
    tracosMaiuscula: ['M50 2 C29 2, 18 21, 18 41 C18 62, 30 80, 50 80 C70 80, 82 62, 82 41 C82 21, 71 2, 50 2'],
    tracos: ['M52 40 C 35 40, 27 52, 28 63 C 29 75, 39 80, 51 80 C 65 80, 73 69, 72 57 C 71 46, 63 40, 52 40'] },
  { maiuscula: 'Π', minuscula: 'π', nome: 'πῖ', nomePt: 'pi', translit: 'p', grupo: 1,
    som: 'p, como em “pato” (sem sopro).',
    tracosMaiuscula: ['M28 2 L28 80', 'M28 2 L72 2 L72 80'],
    tracos: ['M37 47 C 37 61, 35 72, 30 80', 'M63 47 L 63 73 C 63 80, 69 81, 74 77', 'M21 51 C 23 45, 29 44, 37 45 L 81 45'] },
  { maiuscula: 'Ρ', minuscula: 'ρ', nome: 'ῥῶ', nomePt: 'rô', translit: 'r', grupo: 3,
    som: 'r vibrante, como em “caro” (e no começo da palavra, levemente soprado: ῥ = rh).',
    tracosMaiuscula: ['M30 2 L30 80', 'M30 2 L54 2 C70 2, 76 12, 76 22 C76 34, 68 42, 54 42 L30 42'],
    tracos: ['M34 118 L 34 62 C 34 49, 42 42, 52 42 C 64 42, 70 52, 70 62 C 70 74, 62 80, 52 80 C 44 80, 38 76, 34 70'] },
  { maiuscula: 'Σ', minuscula: 'σ', variante: 'ς', nome: 'σίγμα', nomePt: 'sigma', translit: 's', grupo: 1,
    som: 's de “sapo”, nunca z (só antes de β, γ, δ, μ soa z). No fim da palavra escreve-se ς: λόγος.',
    tracosMaiuscula: ['M74 2 L26 2 L52 41 L26 80 L76 80'],
    tracos: ['M80 42 L 52 42 C 35 42, 27 53, 28 64 C 29 75, 39 80, 51 80 C 65 80, 72 69, 70 58 C 68 48, 60 42, 52 42'],
    tracosVariante: ['M73 44 C 63 40, 41 40, 33 50 C 25 62, 34 76, 50 82 C 62 86, 64 98, 57 106 C 53 110, 49 109, 46 106'] },
  { maiuscula: 'Τ', minuscula: 'τ', nome: 'ταῦ', nomePt: 'tau', translit: 't', grupo: 1,
    som: 't, como em “tatu” (sem sopro, nunca “tch”).',
    tracosMaiuscula: ['M22 2 L78 2', 'M50 2 L50 80'],
    tracos: ['M52 45 L 52 72 C 52 80, 58 81, 64 77', 'M28 45 L 76 45'] },
  { maiuscula: 'Υ', minuscula: 'υ', nome: 'ὖ ψιλόν', nomePt: 'ípsilon', translit: 'y (u)', grupo: 1,
    som: 'ü: lábios de “u” e língua de “i”, como o u do francês “tu”.',
    tracosMaiuscula: ['M22 2 L50 40', 'M78 2 L50 40 L50 80'],
    tracos: ['M30 42 C 30 60, 32 80, 50 80 C 66 80, 72 62, 72 42'] },
  { maiuscula: 'Φ', minuscula: 'φ', nome: 'φῖ', nomePt: 'fi', translit: 'ph', grupo: 3,
    som: 'p aspirado: p seguido de sopro. Mais tarde virou f, como em “filosofia”.',
    tracosMaiuscula: ['M50 2 L50 80', 'M50 16 C30 16, 20 28, 20 40 C20 54, 32 64, 50 64 C68 64, 80 54, 80 40 C80 28, 70 16, 50 16'],
    tracos: ['M41 44 C 28 48, 24 66, 34 75 C 42 82, 60 82, 68 72 C 76 62, 72 44, 60 42 C 52 41, 50 50, 50 60 L 48 118'] },
  { maiuscula: 'Χ', minuscula: 'χ', nome: 'χῖ', nomePt: 'qui', translit: 'ch', grupo: 3,
    som: 'k aspirado: k seguido de sopro. Mais tarde virou o “rr” forte, como em “carro” (pronúncia carioca).',
    tracosMaiuscula: ['M24 2 L76 80', 'M76 2 L24 80'],
    tracos: ['M27 42 C 40 60, 56 96, 75 118', 'M75 42 L 27 118'] },
  { maiuscula: 'Ψ', minuscula: 'ψ', nome: 'ψῖ', nomePt: 'psi', translit: 'ps', grupo: 4,
    som: 'ps, como em “lapso” (ψ = π + σ).',
    tracosMaiuscula: ['M22 10 C22 40, 31 54, 50 54 C69 54, 78 40, 78 10', 'M50 2 L50 80'],
    tracos: ['M27 44 C 29 62, 33 80, 50 80 C 67 80, 73 62, 75 42', 'M55 4 L 46 118'] },
  { maiuscula: 'Ω', minuscula: 'ω', nome: 'ὦ μέγα', nomePt: 'ômega', translit: 'ō', grupo: 1,
    som: 'ó longo e aberto, como em “avó”, mas prolongado. (“o grande”.)',
    tracosMaiuscula: ['M22 80 L38 80 C24 70, 18 56, 18 42 C18 20, 32 2, 50 2 C68 2, 82 20, 82 42 C82 56, 76 70, 62 80 L78 80'],
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

// ---------------------------------------------------------------------------------------------
// Material da avaliação da Lição 0 (seleção e textos nossos). Transliteração: η = ē, ω = ō,
// υ = y, χ = ch, φ = ph, θ = th, espírito áspero = h, ῥ = rh, γγ = ng; o acento é mantido.

/** Palavras para ler: a transliteração certa e três erradas, cada uma com um erro típico. */
export const LEITURAS: { grego: string; certa: string; erradas: string[] }[] = [
  { grego: 'ἡμέρα', certa: 'hēméra', erradas: ['ēméra', 'heméra', 'hēmérha'] },
  { grego: 'ὁδός', certa: 'hodós', erradas: ['odós', 'hōdós', 'hodóz'] },
  { grego: 'ἵππος', certa: 'híppos', erradas: ['íppos', 'hípos', 'hýppos'] },
  { grego: 'ὕδωρ', certa: 'hýdōr', erradas: ['ýdōr', 'hýdor', 'hídōr'] },
  { grego: 'ῥήτωρ', certa: 'rhḗtōr', erradas: ['rḗtōr', 'rhḗtor', 'hrḗtōr'] },
  { grego: 'Ἑλλάς', certa: 'Hellás', erradas: ['Ellás', 'Hēllás', 'Helás'] },
  { grego: 'ἀγρός', certa: 'agrós', erradas: ['hagrós', 'agrōs', 'akrós'] },
  { grego: 'ἄνθρωπος', certa: 'ánthrōpos', erradas: ['hánthrōpos', 'ántrōpos', 'ánthropos'] },
  { grego: 'εἰρήνη', certa: 'eirḗnē', erradas: ['heirḗnē', 'eirénē', 'irḗnē'] },
  { grego: 'αὐτός', certa: 'autós', erradas: ['hautós', 'avtós', 'autōs'] },
  { grego: 'ἄγγελος', certa: 'ángelos', erradas: ['ággelos', 'hángelos', 'ángelōs'] },
  { grego: 'θεός', certa: 'theós', erradas: ['teós', 'theōs', 'heós'] },
  { grego: 'χώρα', certa: 'chṓra', erradas: ['hṓra', 'chóra', 'xṓra'] },
  { grego: 'ψυχή', certa: 'psychḗ', erradas: ['psichḗ', 'psychá', 'phychḗ'] },
  { grego: 'φιλοσοφία', certa: 'philosophía', erradas: ['pilosopía', 'philozophía', 'phylosophía'] },
  { grego: 'ξένος', certa: 'xénos', erradas: ['zénos', 'chénos', 'xḗnos'] },
]

/** Palavras com espírito áspero e com espírito brando. */
export const ESPIRITO_ASPERO = ['ἡμέρα', 'ὁδός', 'ἵππος', 'ὕδωρ', 'ἥλιος', 'ἑπτά', 'ἱστορία', 'ῥήτωρ', 'ὥρα', 'αἷμα', 'Ἑλλάς', 'ἅμα']
export const ESPIRITO_BRANDO = ['ἀγρός', 'ἄνθρωπος', 'ἔργον', 'ὄνομα', 'ἰδέα', 'αὐτός', 'οἶκος', 'εἰρήνη', 'ἐγώ', 'ὀφθαλμός', 'ἀήρ', 'ἄγγελος']

/** Palavras pelo acento que levam (o grave aparece quando outra palavra vem em seguida). */
export const ACENTO_AGUDO = ['λόγος', 'ἀγρός', 'θεός', 'φίλος', 'ψυχή', 'χώρα', 'ἄνθρωπος', 'ἡμέρα']
export const ACENTO_CIRCUNFLEXO = ['σῶμα', 'δρᾶμα', 'πνεῦμα', 'γῆ', 'μῦθος', 'σῖτος', 'οἶκος', 'Ζεῦ']
export const ACENTO_GRAVE = ['καὶ', 'τὸν', 'τὴν', 'καλὸς', 'ἀγαθὸς', 'σοφὸς', 'ἀγρὸν', 'θεὸς']

/** Palavras com sigma no meio e no fim (pelo menos dois sigmas minúsculos), para a pergunta da grafia correta. */
export const COM_SIGMA = ['σοφός', 'σεισμός', 'στάσις', 'ὅσος', 'θεσμός', 'σεισμοῖς', 'ἱστός', 'σοφίας']

/** Perguntas sobre as regras (a primeira opção é a certa; a ordem é sorteada na hora). */
export const REGRAS: { pergunta: string; opcoes: [string, string, string, string]; tema: 'espíritos' | 'acentos' | 'escrita' }[] = [
  { tema: 'espíritos', pergunta: 'O espírito áspero (como em ἁ) indica…', opcoes: ['um som de h antes da vogal', 'que a vogal é longa', 'que a sílaba é a mais forte', 'que a palavra é estrangeira'] },
  { tema: 'espíritos', pergunta: 'Que palavras levam espírito?', opcoes: ['todas as que começam por vogal ou ditongo (e as que começam por ρ)', 'só as que começam por consoante', 'só os nomes próprios', 'só as palavras de uma sílaba'] },
  { tema: 'espíritos', pergunta: 'Numa palavra que começa por ditongo (αὐτός, εἰρήνη), o espírito fica…', opcoes: ['sobre a segunda vogal do ditongo', 'sobre a primeira vogal', 'antes da palavra, separado', 'sobre a última sílaba'] },
  { tema: 'espíritos', pergunta: 'O ρ e o υ no começo da palavra…', opcoes: ['levam sempre espírito áspero (ῥ, ὑ)', 'levam sempre espírito brando', 'nunca levam espírito', 'levam sempre acento grave'] },
  { tema: 'espíritos', pergunta: 'Numa maiúscula (Ὁ, Ἀθῆναι), o espírito se escreve…', opcoes: ['antes da letra, no alto à esquerda', 'em cima da letra', 'depois da letra', 'embaixo da letra'] },
  { tema: 'acentos', pergunta: 'O acento circunflexo (como em ῶ) só pode ficar…', opcoes: ['sobre vogal longa ou ditongo, numa das duas últimas sílabas', 'sobre qualquer vogal, em qualquer sílaba', 'só na primeira sílaba da palavra', 'só sobre vogais breves'] },
  { tema: 'acentos', pergunta: 'Em que sílabas o acento agudo pode ficar?', opcoes: ['numa das três últimas', 'só na última', 'em qualquer sílaba', 'só na primeira'] },
  { tema: 'acentos', pergunta: 'Quando aparece o acento grave?', opcoes: ['no lugar do agudo da última sílaba, quando outra palavra vem logo depois', 'em toda palavra no fim da frase', 'sobre as vogais longas', 'no lugar do circunflexo'] },
  { tema: 'acentos', pergunta: 'Espírito e acento na mesma vogal: como se escrevem?', opcoes: ['o espírito vem antes do agudo ou do grave (ἄ, ἃ) e fica embaixo do circunflexo (ἆ)', 'o acento vem sempre antes do espírito', 'nunca aparecem juntos', 'o espírito fica embaixo da vogal'] },
  { tema: 'acentos', pergunta: 'No grego antigo, o acento marcava…', opcoes: ['a altura da voz (a sílaba soava mais aguda)', 'a duração da vogal', 'uma pausa', 'o fim da frase'] },
  { tema: 'escrita', pergunta: 'Quando se usa ς?', opcoes: ['só no fim da palavra', 'só no começo da palavra', 'no meio da palavra', 'antes de vogal'] },
  { tema: 'escrita', pergunta: 'O que é o iota subscrito (ᾳ, ῃ, ῳ)?', opcoes: ['um ι pequeno escrito embaixo de α, η ou ω', 'um acento especial', 'um espírito escrito embaixo', 'um sinal de vogal breve'] },
  { tema: 'escrita', pergunta: 'Em ΠΡΟΣ ΤΗΙ ΚΡΗΝΗΙ (só maiúsculas), o Ι escrito depois do Η corresponde a…', opcoes: ['um iota subscrito', 'um iota acentuado', 'um ditongo ει', 'um erro de cópia'] },
  { tema: 'escrita', pergunta: 'Como soa o γ em ἄγγελος?', opcoes: ['o primeiro γ soa como n (ánguelos)', 'os dois soam como g (ággelos)', 'o primeiro γ não soa', 'como o j de “jarro”'] },
  { tema: 'escrita', pergunta: 'O ponto e vírgula grego (;) equivale a…', opcoes: ['ponto de interrogação', 'ponto e vírgula', 'dois-pontos', 'ponto final'] },
]

/** Letras fáceis de confundir com letras do nosso alfabeto (entram com mais frequência na avaliação). */
export const LETRAS_TRAICOEIRAS = ['ν', 'υ', 'ρ', 'η', 'ω', 'χ', 'ξ', 'ζ', 'γ', 'ψ', 'Η', 'Ρ', 'Χ', 'Υ', 'Ν', 'Σ']

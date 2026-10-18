// Utilitários para texto grego politônico.

/** Remove acentos, espíritos, iota subscrito, mácrons etc. e põe em minúsculas. */
export function semDiacriticos(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ᷀-᷿͂̓̈́ͅ]/g, '')
    .replace(/[᾿῾’'´`῀]/g, '')
    .toLowerCase()
    .replace(/ς/g, 'σ')
    .normalize('NFC')
}

/** Chave de comparação: sem diacríticos, sem pontuação, espaços simples. */
export function chave(s: string): string {
  return semDiacriticos(s).replace(/[^\p{L}\s]/gu, '').replace(/\s+/g, ' ').trim()
}

/** Compara a resposta do aluno com a esperada. */
export function respostaCorreta(dada: string, esperada: string, exigirAcentos = false): boolean {
  if (exigirAcentos) return dada.normalize('NFC').trim() === esperada.normalize('NFC').trim()
  return chave(dada) === chave(esperada)
}

/** Glosa: aceita qualquer uma das alternativas separadas por ";" ou ",". */
export function glosaCorreta(dada: string, glosa: string): boolean {
  const norm = (x: string) =>
    x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/\(.*?\)/g, '').replace(/[!?.¿¡]/g, '').trim()
  const d = norm(dada)
  if (!d) return false
  return glosa.split(/[;,]/).map(norm).filter(Boolean).some(g => g === d || g.replace(/^(o|a|os|as|um|uma) /, '') === d)
}

// ---- Beta code simplificado → Unicode ----
const LETRAS: Record<string, string> = {
  a: 'α', b: 'β', g: 'γ', d: 'δ', e: 'ε', z: 'ζ', h: 'η', q: 'θ', i: 'ι', k: 'κ', l: 'λ', m: 'μ',
  n: 'ν', c: 'ξ', o: 'ο', p: 'π', r: 'ρ', s: 'σ', t: 'τ', u: 'υ', f: 'φ', x: 'χ', y: 'ψ', w: 'ω', v: 'ϝ',
}
const DIAC: Record<string, string> = {
  ')': '̓', '(': '̔', '/': '́', '\\': '̀', '=': '͂', '|': 'ͅ', '+': '̈',
}

/**
 * Converte beta code (minúsculas, TLG simplificado) em grego Unicode.
 * Ex.: "lo/gos" → "λόγος", "a)/nqrwpos" → "ἄνθρωπος", "*a)qhna=" → "Ἀθηνᾶ".
 * Diacríticos vêm depois da letra (como no teclado de Logeion/Perseus).
 */
export function betaParaGrego(beta: string): string {
  let out = ''
  let maiuscula = false
  for (const ch of beta) {
    if (ch === '*') { maiuscula = true; continue }
    const lower = ch.toLowerCase()
    if (LETRAS[lower]) {
      const l = LETRAS[lower]
      out += maiuscula || ch !== lower ? l.toUpperCase() : l
      maiuscula = false
    } else if (DIAC[ch]) {
      out += DIAC[ch]
    } else out += ch
  }
  // sigma final
  out = out.replace(/σ(?=$|[^\p{L}\p{M}])/gu, 'ς')
  return out.normalize('NFC')
}

/** Contém letras gregas? */
export const ehGrego = (s: string) => /[Ͱ-Ͽἀ-῿]/.test(s)

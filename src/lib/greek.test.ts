import { describe, expect, it } from 'vitest'
import { betaParaGrego, chave, glosaCorreta, respostaCorreta } from './greek'

describe('greek', () => {
  it('remove diacríticos', () => {
    expect(chave('ἄνθρωπος')).toBe('ανθρωποσ')
    expect(chave('τῇ θαλάττῃ')).toBe('τη θαλαττη')
  })
  it('compara respostas com e sem acentos', () => {
    expect(respostaCorreta('λογος', 'λόγος')).toBe(true)
    expect(respostaCorreta('λογος', 'λόγος', true)).toBe(false)
  })
  it('converte beta code', () => {
    expect(betaParaGrego('lo/gos')).toBe('λόγος')
    expect(betaParaGrego('a)/nqrwpos')).toBe('ἄνθρωπος')
    expect(betaParaGrego('th=| qala/tth|')).toBe('τῇ θαλάττῃ')
    expect(betaParaGrego('*a)qh=nai')).toBe('Ἀθῆναι')
  })
  it('aceita qualquer glosa alternativa', () => {
    expect(glosaCorreta('mas', 'e; mas')).toBe(true)
    expect(glosaCorreta('navio', 'o navio, barco')).toBe(true)
    expect(glosaCorreta('Partenon', 'o Partenon')).toBe(true)
    expect(glosaCorreta('casa', 'e; mas')).toBe(false)
  })
})

// Toda lição da trilha precisa gerar uma avaliação válida; senão o aluno ficaria preso nela.
import { describe, expect, it } from 'vitest'
import { passosTrilha } from '../content'
import { gerarAvaliacao, perguntaDeSinais, TAMANHO, TAMANHO_ALFABETO } from './avaliacao'
import { licaoAlfabeto } from '../content'

describe('avaliação de cada lição', () => {
  for (const { licao } of passosTrilha.filter(p => !p.licao.emPreparacao)) {
    it(licao.rotulo, () => {
      for (let rodada = 0; rodada < 5; rodada++) {
        const ps = gerarAvaliacao(licao)
        expect(ps.length, 'perguntas suficientes').toBeGreaterThanOrEqual(Math.min(TAMANHO, 8))
        expect(new Set(ps.map(p => p.id)).size, 'sem perguntas repetidas').toBe(ps.length)
        for (const p of ps) {
          expect(p.opcoes, p.enunciado).toHaveLength(4)
          expect(new Set(p.opcoes).size, `opções repetidas: ${p.opcoes}`).toBe(4)
          expect(p.opcoes, `a certa está entre as opções: ${p.enunciado}`).toContain(p.certa)
        }
      }
    })
  }
})

describe('avaliação da Lição 0', () => {
  it('tem 20 perguntas e cobre letras, leitura, espíritos, acentos, sigma e regras', () => {
    for (let rodada = 0; rodada < 30; rodada++) {
      const ps = gerarAvaliacao(licaoAlfabeto)
      expect(ps).toHaveLength(TAMANHO_ALFABETO)
      const temas = new Set(ps.map(p => p.id.split(':')[0]))
      for (const t of ['letra', 'leitura', 'espirito', 'acento', 'sigma', 'regra']) expect(temas, t).toContain(t)
      for (const p of ps) {
        expect(new Set(p.opcoes).size, `opções: ${p.opcoes}`).toBe(4)
        expect(p.opcoes).toContain(p.certa)
      }
    }
  })
  it('o treino de sinais sempre gera perguntas válidas', () => {
    for (let i = 0; i < 100; i++) {
      const p = perguntaDeSinais()
      expect(new Set(p.opcoes).size, `opções: ${p.opcoes}`).toBe(4)
      expect(p.opcoes).toContain(p.certa)
    }
  })
})

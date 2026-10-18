// Toda lição da trilha precisa gerar uma avaliação válida; senão o aluno ficaria preso nela.
import { describe, expect, it } from 'vitest'
import { passosTrilha } from '../content'
import { gerarAvaliacao, TAMANHO } from './avaliacao'

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

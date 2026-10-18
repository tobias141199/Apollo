import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { passosTrilha, trilha } from '../content'
import { useEstudadas } from '../lib/estudadas'

/**
 * A trilha única como uma linha do tempo vertical: uma linha reta com um ponto por lição.
 * O que já foi estudado fica esmaecido (e a linha, colorida até ali); a lição atual fica em destaque.
 */
export function Trilha() {
  const { estudadas, alternar } = useEstudadas()
  const disponiveis = passosTrilha.filter(p => !p.licao.emPreparacao)
  const feitos = disponiveis.filter(p => estudadas.has(p.licao.id)).length
  const atual = disponiveis.find(p => !estudadas.has(p.licao.id))?.licao.id
  const aqui = useRef<HTMLLIElement>(null)

  // Abre a página já no ponto onde o aluno parou.
  useEffect(() => {
    if (feitos > 0) aqui.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="pagina trilha">
      <h1>Trilha de estudo</h1>
      <p className="sub">
        Os dois métodos numa só sequência: as seções da <span className="marca-livro livro-jact">JACT</span> e os capítulos do{' '}
        <span className="marca-livro livro-athenaze">Athenaze</span>. Cada livro retoma, explica de outro jeito ou amplia o que o outro trouxe.
      </p>
      <div className="trilha-resumo">
        <div className="trilha-barra" role="progressbar" aria-valuenow={feitos} aria-valuemax={disponiveis.length}>
          <div style={{ width: `${100 * feitos / Math.max(disponiveis.length, 1)}%` }} />
        </div>
        <span>{feitos} de {disponiveis.length} lições estudadas</span>
      </div>

      <ol className="linha-tempo">
        {trilha.etapas.map((e, n) => {
          const passos = passosTrilha.filter(p => p.etapa === n)
          const feitosEtapa = passos.filter(p => estudadas.has(p.licao.id)).length
          const etapaFeita = passos.length > 0 && feitosEtapa === passos.filter(p => !p.licao.emPreparacao).length
          return [
            <li key={`e${n}`} className={`marco ${etapaFeita ? 'feito' : ''}`}>
              <span className="marco-num" aria-hidden>{n}</span>
              <div className="marco-texto">
                <span className="marco-rotulo">Etapa {n} · {feitosEtapa}/{passos.length}</span>
                <h2>{e.titulo}</h2>
                {e.nota && <p>{e.nota}</p>}
              </div>
            </li>,
            ...passos.map(({ licao: l, porque }) => {
              const feito = estudadas.has(l.id)
              const ehAtual = l.id === atual
              const livro = l.livro.toLowerCase()
              return (
                <li key={l.id} ref={ehAtual ? aqui : undefined}
                  className={`passo-tempo livro-${livro} ${feito ? 'feito' : ''} ${ehAtual ? 'atual' : ''} ${l.emPreparacao ? 'pendente' : ''}`}>
                  {l.emPreparacao
                    ? <span className="no" aria-hidden />
                    : <button className="no" onClick={() => alternar(l.id)} aria-pressed={feito}
                        title={feito ? 'Estudada (clique para desmarcar)' : 'Marcar como estudada'}
                        aria-label={`${feito ? 'Desmarcar' : 'Marcar'} ${l.rotulo} como estudada`}>{feito ? '✓' : ''}</button>}
                  <div className="passo-cartao">
                    {ehAtual && <span className="voce-esta-aqui">Você está aqui</span>}
                    <Link to={l.rota} className="passo-link">
                      <span className="passo-titulo">
                        <b className={`marca-livro livro-${livro}`}>{l.rotulo}</b>
                        {l.tituloGrego && <span className="gr">{l.tituloGrego}</span>}
                        <span>{l.titulo}</span>
                      </span>
                      {porque && <span className="porque">{porque}</span>}
                      <small>
                        {l.emPreparacao ? 'em preparação'
                          : l.especial ? 'alfabeto · pronúncia · escrita à mão'
                          : `${l.vocab.filter(v => v.aprender).length} palavras · ${l.gramatica.length} tópicos · ${l.exercicios.length} exerc.`}
                      </small>
                    </Link>
                    {ehAtual && <Link to={l.rota} className="botao continuar">{feitos ? 'Continuar' : 'Começar'} ›</Link>}
                  </div>
                </li>
              )
            }),
          ]
        })}
        <li className="marco fim" aria-hidden><span className="marco-num">✦</span><div className="marco-texto"><span className="marco-rotulo">Por enquanto, a trilha termina aqui</span></div></li>
      </ol>
    </div>
  )
}

// A avaliação de uma lição: 10 perguntas de múltipla escolha, uma por vez, com a resposta certa
// mostrada na hora. Com 70% ou mais, a lição é aprovada e a próxima da trilha é liberada.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { licaoPorId, passosTrilha, type Licao } from '../content'
import { gerarAvaliacao, type Pergunta } from '../lib/avaliacao'
import { Cadeado, Certo, Errado } from './Icones'
import { bloqueadaPor, estaLiberada, NOTA_MINIMA, registrarAvaliacao, useProgresso } from '../lib/progresso'

const pct = (x: number) => `${Math.round(x * 100)}%`

/** `exigencia`: algo que falta fazer antes da avaliação (ex.: escrever as letras na Lição 0). */
export function Avaliacao({ l, exigencia }: { l: Licao; exigencia?: React.ReactNode }) {
  const prog = useProgresso()
  const [rodada, setRodada] = useState(0)
  const [fase, setFase] = useState<'inicio' | 'perguntas' | 'fim'>('inicio')
  const perguntas = useMemo(() => gerarAvaliacao(l), [l, rodada])
  const [i, setI] = useState(0)
  const [respostas, setRespostas] = useState<string[]>([])
  const registro = prog.avaliacoes[l.id]
  const aprovada = prog.aprovadas.has(l.id)
  const proxima = passosTrilha[passosTrilha.findIndex(p => p.licao.id === l.id) + 1]?.licao

  if (!estaLiberada(l.id, prog)) {
    const trava = licaoPorId.get(bloqueadaPor(l.id, prog) ?? '') ?? passosTrilha.find(p => p.licao.id === bloqueadaPor(l.id, prog))?.licao
    return (
      <div className="avaliacao trancada">
        <p className="avaliacao-cadeado" aria-hidden><Cadeado /></p>
        <p>A avaliação desta lição abre quando você passar nas anteriores.
          {trava && <> Próximo passo: <Link to={trava.rota}>{trava.rotulo}{trava.titulo ? ` · ${trava.titulo}` : ''}</Link>.</>}</p>
      </div>
    )
  }
  if (exigencia && fase === 'inicio') return (
    <div className="avaliacao trancada">
      <p className="avaliacao-cadeado" aria-hidden><Cadeado /></p>
      <h2>Avaliação da lição</h2>
      <p>{exigencia}</p>
    </div>
  )
  if (perguntas.length < 4) return <p className="vazio">Esta lição ainda não tem material suficiente para uma avaliação.</p>

  const comecar = () => { setRodada(r => r + 1); setI(0); setRespostas([]); setFase('perguntas') }
  const q = perguntas[i]
  const respondida = respostas[i] != null
  const acertos = respostas.filter((r, j) => r === perguntas[j]?.certa).length

  const responder = (o: string) => { if (!respondida) setRespostas(r => { const n = [...r]; n[i] = o; return n }) }
  const avancar = () => {
    if (i + 1 < perguntas.length) return setI(i + 1)
    registrarAvaliacao(l.id, acertos / perguntas.length)
    setFase('fim')
  }

  if (fase === 'inicio') return (
    <div className="avaliacao">
      <h2>Avaliação da lição</h2>
      <p>{perguntas.length} perguntas de múltipla escolha sobre o vocabulário e as formas desta lição.
        Acerte <b>{pct(NOTA_MINIMA)}</b> ou mais para {proxima ? <>liberar <b>{proxima.rotulo}</b></> : 'concluir a trilha'}.</p>
      {registro && (
        <p className={`avaliacao-situacao ${aprovada ? 'ok' : ''}`}>
          {aprovada ? <><Certo /> Aprovada</> : 'Ainda não aprovada'} · melhor nota {pct(registro.melhor)} · {registro.tentativas} {registro.tentativas === 1 ? 'tentativa' : 'tentativas'}
        </p>
      )}
      {!registro && aprovada && <p className="avaliacao-situacao ok"><Certo /> Lição já marcada como estudada.</p>}
      <button className="botao" onClick={comecar}>{registro || aprovada ? 'Fazer de novo' : 'Começar'}</button>
    </div>
  )

  if (fase === 'fim') {
    const nota = acertos / perguntas.length
    const passou = nota >= NOTA_MINIMA
    const erradas = perguntas.map((p, j) => ({ p, r: respostas[j] })).filter(x => x.r !== x.p.certa)
    return (
      <div className={`avaliacao fim ${passou ? 'passou' : 'nao-passou'}`}>
        <p className="avaliacao-nota">{pct(nota)}</p>
        <h2>{passou ? 'Aprovado!' : 'Ainda não foi desta vez'}</h2>
        <p>{acertos} de {perguntas.length} acertos. {passou
          ? proxima ? <>A lição <b>{proxima.rotulo}</b> está liberada.</> : 'Você concluiu a trilha!'
          : `Você precisa de ${pct(NOTA_MINIMA)}. Revise o que errou e tente de novo: as perguntas mudam a cada tentativa.`}</p>
        {erradas.length > 0 && (
          <details className="avaliacao-erros" open={!passou}>
            <summary>Rever as {erradas.length} que você errou</summary>
            <ul>{erradas.map(({ p, r }) => <li key={p.id}><Erro p={p} r={r} /></li>)}</ul>
          </details>
        )}
        <div className="avaliacao-botoes">
          {passou && proxima && <Link className="botao" to={proxima.rota}>Ir para {proxima.rotulo} ›</Link>}
          <button className={`botao ${passou ? 'secundario' : ''}`} onClick={comecar}>Tentar de novo</button>
        </div>
      </div>
    )
  }

  return (
    <div className="avaliacao">
      <div className="avaliacao-topo">
        <span>Pergunta {i + 1} de {perguntas.length}</span>
        <span>{acertos} {acertos === 1 ? 'acerto' : 'acertos'}</span>
      </div>
      <div className="progresso"><div style={{ width: `${100 * (i + (respondida ? 1 : 0)) / perguntas.length}%` }} /></div>
      <p className="avaliacao-enunciado">{q.enunciado}{q.origem && <small> · {q.origem}</small>}</p>
      {q.destaque && <p className={`avaliacao-destaque ${q.destaqueGrego ? 'gr' : ''}`}>{q.destaque}</p>}
      <div className="avaliacao-opcoes">
        {q.opcoes.map(o => (
          <button key={o} onClick={() => responder(o)} disabled={respondida && o !== q.certa && o !== respostas[i]}
            className={`${q.opcoesGrego ? 'gr' : ''} ${respondida ? o === q.certa ? 'certa' : o === respostas[i] ? 'errada' : '' : ''}`}>
            {o}
          </button>
        ))}
      </div>
      {respondida && (
        <div className="avaliacao-seguir">
          <span>{respostas[i] === q.certa ? <><Certo /> Certo!</> : <><Errado /> A resposta é <b className={q.opcoesGrego ? 'gr' : ''}>{q.certa}</b></>}</span>
          <button className="botao" onClick={avancar} autoFocus>{i + 1 < perguntas.length ? 'Próxima ›' : 'Ver resultado'}</button>
        </div>
      )}
    </div>
  )
}

function Erro({ p, r }: { p: Pergunta; r?: string }) {
  return <>
    {p.enunciado} {p.destaque && <b className={p.destaqueGrego ? 'gr' : ''}>{p.destaque}</b>} → <b className={p.opcoesGrego ? 'gr' : ''}>{p.certa}</b>
    {r && <span className="vazio"> (você marcou {r})</span>}
  </>
}

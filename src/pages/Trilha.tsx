import { Link } from 'react-router-dom'
import { passosTrilha, trilha } from '../content'
import { useEstudadas } from '../lib/estudadas'

/** A trilha única: seções da JACT e capítulos do Athenaze intercalados, etapa por etapa. */
export function Trilha() {
  const { estudadas, alternar } = useEstudadas()
  const feitos = passosTrilha.filter(p => estudadas.has(p.licao.id)).length
  const proximo = passosTrilha.find(p => !estudadas.has(p.licao.id) && !p.licao.emPreparacao)
  return (
    <div className="pagina">
      <h1>Trilha de estudo</h1>
      <p className="sub">
        Os dois métodos intercalados: as seções da <span className="marca-livro livro-jact">JACT</span> e os capítulos do{' '}
        <span className="marca-livro livro-athenaze">Athenaze</span> numa só sequência. Cada livro retoma, explica de outro jeito
        ou amplia o que o outro trouxe.
      </p>
      <p className="progresso-trilha">
        {feitos} de {passosTrilha.length} lições estudadas
        {proximo && <> · <Link to={proximo.licao.rota}>continuar em <b>{proximo.licao.rotulo}</b> ›</Link></>}
      </p>
      {trilha.etapas.map((e, n) => (
        <section key={n} className="etapa">
          <h2><span className="num-etapa">{n + 1}</span> {e.titulo}</h2>
          {e.nota && <p className="nota">{e.nota}</p>}
          <ol className="passos">
            {passosTrilha.filter(p => p.etapa === n).map(({ licao: l, porque }) => (
              <li key={l.id} className={`passo livro-${l.livro.toLowerCase()} ${l.emPreparacao ? 'pendente' : ''} ${estudadas.has(l.id) ? 'feito' : ''}`}>
                <Link to={l.rota} className="passo-corpo">
                  <span className="passo-cab">
                    <b className={`marca-livro livro-${l.livro.toLowerCase()}`}>{l.rotulo}</b>
                    {l.tituloGrego && <span className="gr">{l.tituloGrego}</span>}
                    <span>{l.titulo}</span>
                  </span>
                  {porque && <span className="porque">{porque}</span>}
                  <small>
                    {l.emPreparacao ? `em preparação · ${l.resumo ?? ''}`
                      : `${l.vocab.filter(v => v.aprender).length} palavras · ${l.gramatica.length} tópicos · ${l.exercicios.length} exerc.`}
                  </small>
                </Link>
                {!l.emPreparacao && (
                  <label className="check feito-check" title="Marcar como estudada">
                    <input type="checkbox" checked={estudadas.has(l.id)} onChange={() => alternar(l.id)} /> estudada
                  </label>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

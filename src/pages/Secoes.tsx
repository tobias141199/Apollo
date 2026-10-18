import { Link } from 'react-router-dom'
import { licoes, NOMES_SECAO, PARTES, secoes, TITULOS_SECAO, type Licao } from '../content'

/** Índice por livro: as seções da JACT e os capítulos do Athenaze em duas colunas. */
export function Secoes() {
  const caps = licoes.filter(l => l.livro === 'Athenaze').sort((a, b) => +a.id.slice(3) - +b.id.slice(3))
  return (
    <div className="pagina larga">
      <h1>Índice por livro</h1>
      <p className="sub">
        Cada livro na sua própria ordem. Para estudar os dois intercalados, siga a <Link to="/trilha">trilha</Link>.
      </p>
      <div className="dois-livros">
        <div className="coluna-livro">
          <h2><span className="marca-livro livro-jact">JACT</span> <i>Aprendendo Grego</i>, Partes 1 e 2</h2>
          {Object.entries(PARTES).map(([p, parte]) => (
            <section key={p} className="parte">
              <h3>Parte {p}: {parte.titulo}</h3>
              {parte.secoes.map(n => (
                <div key={n} className="secao-bloco">
                  <h4>Seção {NOMES_SECAO[n]} <span className="titulo-secao">{TITULOS_SECAO[n]}</span></h4>
                  <div className="subsecoes">
                    {secoes.filter(s => s.secao === n).map(s => (
                      <Link key={s.id} to={`/secao/${s.id}`} className="subsecao">
                        <b>{s.id}</b>
                        <span>{s.titulo ?? ''}</span>
                        <small>{s.vocab.filter(v => v.aprender).length} a aprender · {s.exercicios.length} exerc.</small>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
        <div className="coluna-livro">
          <h2><span className="marca-livro livro-athenaze">Athenaze</span> Book I (Balme &amp; Lawall)</h2>
          <div className="subsecoes capitulos">
            {caps.map(c => <CartaoCapitulo key={c.id} c={c} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

function CartaoCapitulo({ c }: { c: Licao }) {
  const jact = c.ponte?.correspondentes.filter(id => !id.startsWith('ath')) ?? []
  return (
    <Link to={c.rota} className={`subsecao livro-athenaze ${c.emPreparacao ? 'pendente' : ''}`}>
      <b>Cap. {c.id.slice(3)}</b>
      <span><span className="gr">{c.tituloGrego}</span>{c.titulo && ` · ${c.titulo}`}</span>
      <small>
        {c.emPreparacao ? 'em preparação' : `${c.vocab.filter(v => v.aprender).length} palavras · ${c.textos.length} leituras · ${c.exercicios.length} exerc.`}
        {jact.length > 0 && ` · JACT ${jact.slice(0, 4).join(', ')}${jact.length > 4 ? '…' : ''}`}
      </small>
    </Link>
  )
}

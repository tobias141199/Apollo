import { Link, useParams } from 'react-router-dom'
import { entradaPorChave, licoes, paradigmaPorId, todasCitacoes } from '../content'
import { FonteTag } from '../components/FonteTag'
import { Credito, Friso, Quadro } from '../components/Tabuleta'
import { EditorImagem, useImagem } from '../components/EditorImagem'
import { TabelaParadigma } from '../components/TabelaParadigma'
import { chave as chaveDe } from '../lib/greek'

/** Página de verbete, no espírito do Logeion: lema, glosa, onde aparece, paradigma e exemplos. */
export function Verbete() {
  const k = decodeURIComponent(useParams().chave ?? '')
  const e = entradaPorChave.get(k)
  const img = useImagem(k)
  if (!e) return <div className="pagina"><p>Palavra não encontrada. <Link to="/vocabulario">Ver vocabulário</Link></p></div>

  const ocorrencias = licoes.flatMap(l => l.vocab.filter(v => chaveDe(v.grego) === k).map(v => ({ l, v })))
  const raiz = k.slice(0, Math.max(3, k.length - 2))
  const exemplos = todasCitacoes
    .filter(c => chaveDe(c.grego).split(' ').some(w => w.startsWith(raiz))).slice(0, 8)
  const parad = e.paradigma ? paradigmaPorId.get(e.paradigma) : undefined

  return (
    <article className="pagina verbete">
      <header>
        <h1 className="gr lema-grande">{e.grego}</h1>
        {e.lexical && e.lexical !== e.grego && <div className="gr lexical">{e.lexical}</div>}
        <div className="classe">{e.classe}{e.aprender && <span className="selo">a aprender</span>}</div>
      </header>
      <p className="glosa-grande">{e.glosa}</p>
      {(img || import.meta.env.DEV) && (
        <figure className="verbete-imagem">
          {img && <><Quadro img={img} /><Friso /></>}
          <figcaption><Credito img={img} /><EditorImagem chave={k} lema={e.grego} img={img} /></figcaption>
        </figure>
      )}
      {e.partes && <p><span className="rotulo">Partes principais</span> <span className="gr">{e.partes.join(', ')}</span></p>}
      {e.nota && <p className="nota">{e.nota}</p>}

      <section>
        <h2>Onde aparece</h2>
        <ul className="ocorrencias">
          {ocorrencias.map(({ l, v }, i) => (
            <li key={i}>
              <Link to={l.rota} className={`marca-livro livro-${l.livro.toLowerCase()}`}>{l.livro === 'JACT' ? `JACT ${l.rotulo}` : `Athenaze cap. ${l.id.slice(3)}`}</Link>
              {' '}— {v.glosa}{v.aprender && <span className="selo">a aprender</span>} <FonteTag fonte={v.fonte} />
            </li>
          ))}
          {!e.athenazeOrigem && e.athenaze && <li>Athenaze, {e.athenaze}</li>}
        </ul>
      </section>

      {exemplos.length > 0 && (
        <section>
          <h2>Exemplos</h2>
          {exemplos.map((c, i) => (
            <blockquote key={i} className="citacao">
              <p className="gr">{c.grego}</p>
              {c.traducao && <p className="trad">{c.traducao}</p>}
              <FonteTag fonte={c.fonte} />
            </blockquote>
          ))}
        </section>
      )}

      {parad && <section><h2>Paradigma</h2><TabelaParadigma p={parad} /></section>}
    </article>
  )
}

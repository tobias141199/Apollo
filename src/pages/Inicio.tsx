import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { licoes, passosTrilha, paradigmas, vocabulario } from '../content'
import { db } from '../lib/db'
import { licaoAtual, NOTA_MINIMA, useProgresso } from '../lib/progresso'

/** Tela inicial: o que é o programa, onde o aluno parou e, embaixo, os caminhos para cada parte. */
export function Inicio() {
  const prog = useProgresso()
  const [vencidos, setVencidos] = useState<number | null>(null)
  useEffect(() => { db.cartoes.where('card.due').belowOrEqual(new Date()).count().then(setVencidos) }, [])
  const disponiveis = passosTrilha.filter(p => !p.licao.emPreparacao)
  const feitos = disponiveis.filter(p => prog.aprovadas.has(p.licao.id)).length
  const atual = passosTrilha.find(p => p.licao.id === licaoAtual(prog))?.licao
  const capitulos = licoes.filter(l => l.livro === 'Athenaze' && !l.emPreparacao).length

  return (
    <div className="inicio">
      <header className="inicio-cab">
        <h1 className="titulo-grande">Aprendendo <span className="gr">Ἑλληνικά</span></h1>
        <div className="friso" aria-hidden />
        <p className="inicio-lead">
          Um caminho para ler grego antigo, feito para quem fala português. O programa junta dois cursos clássicos,
          o <b>JACT</b> (<i>Aprendendo Grego</i>) e o <b>Athenaze</b>, numa única trilha de lições.
        </p>
      </header>

      <ol className="como-funciona">
        <li><b>Siga a trilha.</b> As lições dos dois livros vêm intercaladas, cada uma retomando ou ampliando a outra. Comece pela Lição 0, do alfabeto.</li>
        <li><b>Estude cada lição.</b> Vocabulário, gramática com tabelas, textos, exercícios e a “ponte” que liga os dois livros.</li>
        <li><b>Passe na avaliação.</b> No fim de cada lição, acerte {Math.round(NOTA_MINIMA * 100)}% ou mais para liberar a seguinte.</li>
        <li><b>Revise todo dia.</b> Os flashcards trazem de volta cada palavra na hora certa de não esquecer.</li>
      </ol>

      <section className="inicio-onde">
        {atual ? (
          <Link to={atual.rota} className="continuar-cartao">
            <span className="continuar-rotulo">{feitos === 0 ? 'Comece por aqui' : 'Continue de onde parou'}</span>
            <span className="continuar-licao">
              <b className={`marca-livro livro-${atual.livro.toLowerCase()}`}>{atual.rotulo}</b>
              {atual.tituloGrego && <span className="gr">{atual.tituloGrego}</span>} {atual.titulo}
            </span>
            <span className="continuar-meta">{feitos} de {disponiveis.length} lições aprovadas</span>
            <span className="continuar-seta" aria-hidden>›</span>
          </Link>
        ) : (
          <p className="continuar-cartao">Você passou em todas as lições disponíveis. Parabéns!</p>
        )}
      </section>

      <nav className="menu-inicio" aria-label="Partes do programa">
        <Link to="/trilha" className="item-menu">
          <span className="item-letra gr" aria-hidden>τ</span>
          <b>Trilha</b><span>As lições em ordem, com o seu progresso</span>
        </Link>
        <Link to="/flashcards" className="item-menu">
          <span className="item-letra gr" aria-hidden>μ</span>
          <b>Flashcards</b>
          <span>{vencidos == null ? 'Revisão do vocabulário' : vencidos === 0 ? 'Nenhuma revisão para hoje' : `${vencidos} ${vencidos === 1 ? 'revisão' : 'revisões'} para hoje`}</span>
        </Link>
        <Link to="/vocabulario" className="item-menu">
          <span className="item-letra gr" aria-hidden>λ</span>
          <b>Vocabulário</b><span>{vocabulario.length} palavras, com busca</span>
        </Link>
        <Link to="/tabelas" className="item-menu">
          <span className="item-letra gr" aria-hidden>π</span>
          <b>Tabelas</b><span>{paradigmas.length} paradigmas para consultar e comparar</span>
        </Link>
        <Link to="/secoes" className="item-menu">
          <span className="item-letra gr" aria-hidden>β</span>
          <b>Índice</b><span>{licoes.filter(l => l.livro === 'JACT').length} seções da JACT · {capitulos} capítulos do Athenaze</span>
        </Link>
        <Link to="/ajustes" className="item-menu">
          <span className="item-letra gr" aria-hidden>σ</span>
          <b>Ajustes</b><span>Conta, backup e digitação do grego</span>
        </Link>
      </nav>
    </div>
  )
}

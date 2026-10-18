import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { licaoPorId, licoes, passosTrilha, vocabulario } from '../content'
import { useEstudadas } from '../lib/estudadas'
import { db } from '../lib/db'
import { buscar } from '../lib/busca'
import { betaParaGrego, ehGrego } from '../lib/greek'
import { useSelecao } from '../lib/selecao'

export function Inicio() {
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const res = buscar(q, 12)
  const { vocab } = useSelecao()
  const [vencidos, setVencidos] = useState<number | null>(null)
  const { estudadas } = useEstudadas()
  const proximo = passosTrilha.find(p => !estudadas.has(p.licao.id) && !p.licao.emPreparacao)?.licao
  useEffect(() => { db.cartoes.where('card.due').belowOrEqual(new Date()).count().then(setVencidos) }, [])

  return (
    <div className="inicio">
      <h1 className="titulo-grande">Aprendendo <span className="gr">Ἑλληνικά</span></h1>
      <p className="sub">Dois métodos lado a lado: JACT, <i>Aprendendo Grego</i> (Seções 1–7), e <i>Athenaze</i> Book I, numa trilha só</p>
      <div className="busca">
        <input
          autoFocus value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar: λόγος · lo/gos · navio"
          aria-label="Buscar palavra"
          onKeyDown={e => { if (e.key === 'Enter' && res[0]) nav(`/palavra/${encodeURIComponent(res[0].chave)}`) }}
        />
        {q && !ehGrego(q) && /[a-z]/.test(q) && <div className="beta-dica gr">{betaParaGrego(q)}</div>}
        {q && (
          <ul className="resultados">
            {res.map(e => (
              <li key={e.chave}>
                <Link to={`/palavra/${encodeURIComponent(e.chave)}`}>
                  <span className="gr lema">{e.grego}</span> <span className="glosa">{e.glosa}</span>
                  <span className="secao-mini">{licaoPorId.get(e.licaoId)?.rotulo}</span>
                </Link>
              </li>
            ))}
            {res.length === 0 && <li className="vazio">Nada encontrado.</li>}
          </ul>
        )}
      </div>

      <div className="cartoes-inicio">
        <Link to={proximo?.rota ?? '/trilha'} className="cartao-inicio destaque">
          <b>Trilha</b>
          <span>{proximo ? <>continuar em {proximo.rotulo}{proximo.tituloGrego && <> · <span className="gr">{proximo.tituloGrego}</span></>}</> : 'JACT e Athenaze intercalados'}</span>
        </Link>
        <Link to="/flashcards" className="cartao-inicio">
          <b>Flashcards</b>
          <span>{vencidos == null ? '…' : vencidos === 0 ? 'nenhuma revisão pendente' : `${vencidos} revisões pendentes`}</span>
        </Link>
        <Link to="/quiz" className="cartao-inicio"><b>Quiz</b><span>{vocab.length} palavras selecionadas</span></Link>
        <Link to="/tabelas" className="cartao-inicio"><b>Tabelas</b><span>paradigmas lado a lado</span></Link>
        <Link to="/secoes" className="cartao-inicio"><b>Índice</b><span>{licoes.filter(l => l.livro === 'JACT').length} seções · {licoes.filter(l => l.livro === 'Athenaze' && !l.emPreparacao).length} capítulos · {vocabulario.length} palavras</span></Link>
      </div>
    </div>
  )
}

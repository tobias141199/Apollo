import { useState } from 'react'
import { Link } from 'react-router-dom'
import { licaoPorId } from '../content'
import { SeletorSecoes } from '../components/SeletorSecoes'
import { buscar } from '../lib/busca'
import { useSelecao } from '../lib/selecao'

export function Vocabulario() {
  const { vocab } = useSelecao()
  const [q, setQ] = useState('')
  const lista = q ? buscar(q, 500).filter(e => vocab.includes(e)) : vocab
  return (
    <div className="pagina">
      <h1>Vocabulário</h1>
      <SeletorSecoes />
      <input className="filtro" value={q} onChange={e => setQ(e.target.value)} placeholder="Filtrar (grego, beta code ou português)" />
      <table className="lista-vocab">
        <tbody>
          {lista.map(e => (
            <tr key={e.chave}>
              <td className="gr lema"><Link to={`/palavra/${encodeURIComponent(e.chave)}`}>{e.lexical ?? e.grego}</Link></td>
              <td>{e.glosa}</td>
              <td className="secao-mini">
                {[e.jact, e.athenazeOrigem].filter(o => !!o).map(o => {
                  const l = licaoPorId.get(o.licaoId)!
                  return <Link key={o.licaoId} to={l.rota} className={`marca-livro livro-${l.livro.toLowerCase()}`}>{l.rotulo}</Link>
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {lista.length === 0 && <p className="vazio">Nenhuma palavra. Escolha lições acima.</p>}
    </div>
  )
}

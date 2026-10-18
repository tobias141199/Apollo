import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { entradaPorChave } from '../content'
import { SeletorSecoes } from '../components/SeletorSecoes'
import { preCarregar, Tabuleta } from '../components/Tabuleta'
import { db, type Direcao } from '../lib/db'
import { useSelecao } from '../lib/selecao'
import { cartaoId, montarFila, previsoes, Rating, responder, type Nota } from '../lib/srs'

const BOTOES: [Nota, string, string][] = [
  [Rating.Again, 'Errei', '1'], [Rating.Hard, 'Difícil', '2'], [Rating.Good, 'Bom', '3'], [Rating.Easy, 'Fácil', '4'],
]

export function Flashcards() {
  const { vocab } = useSelecao()
  const [direcao, setDirecao] = useState<Direcao>('gp')
  const [novos, setNovos] = useState(15)
  const [fila, setFila] = useState<string[] | null>(null)
  const [info, setInfo] = useState({ vencidos: 0, novos: 0, aprendidos: 0, total: 0 })
  const [virado, setVirado] = useState(false)
  const [prev, setPrev] = useState<Record<Nota, string> | null>(null)
  const [feitos, setFeitos] = useState(0)

  const carregar = useCallback(async () => {
    const r = await montarFila(vocab.map(v => v.chave), direcao, novos)
    setFila(r.fila); setInfo(r); setVirado(false); setFeitos(0)
  }, [vocab, direcao, novos])
  useEffect(() => { carregar() }, [carregar])

  const atual = fila?.[0]
  const e = atual ? entradaPorChave.get(atual) : undefined
  useEffect(() => { preCarregar(fila?.[1]) }, [fila])
  useEffect(() => {
    if (!atual) return
    db.cartoes.get(cartaoId(direcao, atual)).then(c => setPrev(previsoes(c?.card)))
  }, [atual, direcao])

  const nota = useCallback(async (n: Nota) => {
    if (!atual) return
    const card = await responder(atual, direcao, n)
    setFeitos(f => f + 1)
    setVirado(false)
    // Se errou ou o próximo vencimento é em minutos, volta para o fim da fila desta sessão.
    const volta = n === Rating.Again || +new Date(card.due) - Date.now() < 20 * 60000
    setFila(f => f && (volta ? [...f.slice(1), f[0]] : f.slice(1)))
  }, [atual, direcao])

  useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement).tagName === 'INPUT') return
      if (ev.key === ' ') { ev.preventDefault(); setVirado(true) }
      const b = BOTOES.find(([, , t]) => t === ev.key)
      if (b && virado) nota(b[0])
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [virado, nota])

  return (
    <div className="pagina">
      <h1>Flashcards</h1>
      <SeletorSecoes />
      <div className="barra">
        <div className="segmentado">
          <button className={direcao === 'gp' ? 'ativa' : ''} onClick={() => setDirecao('gp')}>grego → português</button>
          <button className={direcao === 'pg' ? 'ativa' : ''} onClick={() => setDirecao('pg')}>português → grego</button>
        </div>
        <label>novas por sessão <input type="number" min={0} max={100} value={novos} onChange={ev => setNovos(+ev.target.value)} className="num" /></label>
      </div>
      <p className="estat">
        {info.vencidos} para revisar · {info.novos} novas · {info.aprendidos}/{info.total} já vistas · {feitos} respondidas nesta sessão
      </p>

      {fila && !e && (
        <div className="fim">
          <p>Nada para estudar agora. 🎉</p>
          <p>Volte mais tarde para as revisões, aumente as “novas por sessão” ou <Link to="/quiz">faça um quiz</Link>.</p>
        </div>
      )}

      {e && (
        <>
          <Psephoi feitos={feitos} restantes={fila?.length ?? 0} />
          {/* A chave muda a cada cartão: a tabuleta nova entra já de frente (sem mostrar o verso ao desvirar). */}
          <Tabuleta key={`${atual}:${feitos}`} e={e} direcao={direcao} virado={virado} onVirar={() => setVirado(true)} />
          <div className="plaquetas">
            {virado ? BOTOES.map(([n, rot, tecla]) => (
              <button key={n} className={`plaqueta nota-${n}`} onClick={() => nota(n)}>
                <span className="plaqueta-rotulo">{rot}</span><small>{prev?.[n]}</small><kbd>{tecla}</kbd>
              </button>
            )) : (
              <button className="plaqueta virar" onClick={() => setVirado(true)}>
                <span className="plaqueta-rotulo">Virar</span><kbd>espaço</kbd>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** Progresso da sessão como pedrinhas de contagem (ψῆφοι): as escuras já foram respondidas. */
function Psephoi({ feitos, restantes }: { feitos: number; restantes: number }) {
  const MAX = 36
  const total = feitos + restantes
  const mostrar = Math.min(total, MAX)
  const cheias = Math.round(mostrar * feitos / Math.max(total, 1))
  return (
    <div className="psephoi" role="img" aria-label={`${feitos} respondidas, ${restantes} na fila`}>
      {Array.from({ length: mostrar }, (_, i) => <span key={i} className={i < cheias ? 'feita' : ''} />)}
      {total > MAX && <small>+{total - MAX}</small>}
    </div>
  )
}

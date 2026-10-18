import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Entrada } from '../content'
import { GregoInput } from '../components/GregoInput'
import { SeletorSecoes } from '../components/SeletorSecoes'
import { glosaCorreta, respostaCorreta } from '../lib/greek'
import { useSelecao } from '../lib/selecao'

type Modo = 'mc-gp' | 'mc-pg' | 'dig-gp' | 'dig-pg'
const MODOS: [Modo, string][] = [
  ['mc-gp', 'Múltipla escolha · grego → port.'], ['mc-pg', 'Múltipla escolha · port. → grego'],
  ['dig-pg', 'Digitar o grego'], ['dig-gp', 'Digitar o português'],
]

const embaralhar = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }

/** Distratores: preferir mesma classe gramatical (fica mais difícil e útil). */
function opcoes(certa: Entrada, todas: Entrada[]) {
  const mesma = embaralhar(todas.filter(e => e.chave !== certa.chave && e.classe === certa.classe && e.glosa !== certa.glosa))
  const outras = embaralhar(todas.filter(e => e.chave !== certa.chave && e.classe !== certa.classe))
  return embaralhar([certa, ...[...mesma, ...outras].slice(0, 3)])
}

export function Quiz() {
  const { vocab } = useSelecao()
  const [modo, setModo] = useState<Modo>('mc-gp')
  const [tamanho, setTamanho] = useState(20)
  const [acentos, setAcentos] = useState(false)
  const [rodada, setRodada] = useState(0)
  const perguntas = useMemo(() => embaralhar(vocab).slice(0, tamanho), [vocab, tamanho, rodada]) // eslint-disable-line
  const [i, setI] = useState(0)
  const [acertos, setAcertos] = useState(0)
  const [erros, setErros] = useState<Entrada[]>([])
  const [resp, setResp] = useState<string | null>(null)
  const [txt, setTxt] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const p = perguntas[i]
  const ops = useMemo(() => p && modo.startsWith('mc') ? opcoes(p, vocab) : [], [p, modo, vocab])
  const recomecar = () => { setRodada(r => r + 1); setI(0); setAcertos(0); setErros([]); setResp(null); setTxt('') }

  const conferir = (dada: string) => {
    if (resp != null || !p) return
    const ok = modo === 'mc-gp' ? dada === p.glosa
      : modo === 'mc-pg' ? dada === p.grego
        : modo === 'dig-pg' ? respostaCorreta(dada, p.grego, acentos)
          : glosaCorreta(dada, p.glosa)
    setResp(ok ? 'ok' : 'erro')
    if (ok) setAcertos(a => a + 1); else setErros(e => [...e, p])
  }
  const proxima = () => { setI(n => n + 1); setResp(null); setTxt(''); setTimeout(() => ref.current?.focus()) }

  return (
    <div className="pagina">
      <h1>Quiz</h1>
      <SeletorSecoes />
      <div className="barra">
        <select value={modo} onChange={e => { setModo(e.target.value as Modo); recomecar() }}>
          {MODOS.map(([m, r]) => <option key={m} value={m}>{r}</option>)}
        </select>
        <label>perguntas <input type="number" className="num" min={5} max={200} value={tamanho} onChange={e => { setTamanho(+e.target.value); recomecar() }} /></label>
        {modo === 'dig-pg' && <label className="check"><input type="checkbox" checked={acentos} onChange={e => setAcentos(e.target.checked)} /> exigir acentos</label>}
      </div>

      {vocab.length < 4 && <p className="vazio">Selecione mais seções para fazer o quiz.</p>}

      {p && vocab.length >= 4 && (
        <div className="quiz">
          <div className="progresso"><div style={{ width: `${(i / perguntas.length) * 100}%` }} /></div>
          <p className="estat">{i + 1} de {perguntas.length} · {acertos} acertos</p>
          <div className="pergunta-quiz">
            {modo.endsWith('gp') ? <span className="gr lema-grande">{p.grego}</span> : <span className="glosa-grande">{p.glosa}</span>}
            <div className="classe">{p.classe}</div>
          </div>

          {modo.startsWith('mc') ? (
            <div className="opcoes">
              {ops.map(o => {
                const val = modo === 'mc-gp' ? o.glosa : o.grego
                const cls = resp == null ? '' : o.chave === p.chave ? 'certa' : ''
                return <button key={o.chave} className={`opcao ${modo === 'mc-pg' ? 'gr' : ''} ${cls}`} onClick={() => conferir(val)}>{val}</button>
              })}
            </div>
          ) : modo === 'dig-pg' ? (
            <GregoInput ref={ref} value={txt} onChange={setTxt} onEnter={() => resp == null ? conferir(txt) : proxima()} autoFocus />
          ) : (
            <input ref={ref} className="filtro" value={txt} autoFocus onChange={e => setTxt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { if (resp == null) conferir(txt); else proxima() } }} placeholder="tradução" />
          )}

          {resp && (
            <div className={`resultado ${resp}`}>
              {resp === 'ok' ? '✓ Certo!' : <>✗ Resposta: <b className={modo.endsWith('pg') ? 'gr' : ''}>{modo.endsWith('pg') ? p.grego : p.glosa}</b></>}
              <span className="gr"> · {p.lexical ?? p.grego}</span>
              <button className="botao" onClick={proxima} autoFocus={modo.startsWith('mc')}>Próxima ›</button>
            </div>
          )}
          {!resp && modo.startsWith('dig') && <button className="botao" onClick={() => conferir(txt)}>Conferir</button>}
        </div>
      )}

      {perguntas.length > 0 && i >= perguntas.length && (
        <div className="fim">
          <h2>{acertos} de {perguntas.length}</h2>
          {erros.length > 0 && (<>
            <p>Para revisar:</p>
            <ul className="erros">{erros.map(e => <li key={e.chave}><Link className="gr" to={`/palavra/${encodeURIComponent(e.chave)}`}>{e.grego}</Link> — {e.glosa}</li>)}</ul>
          </>)}
          <button className="botao" onClick={recomecar}>Nova rodada</button>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import type { Paradigma } from '../content/schema'
import { FonteTag } from './FonteTag'
import { TIPO_ARRASTE, useJanelas, type Arraste } from '../lib/janelas'

interface Props {
  p: Paradigma
  destacar?: boolean
  /** Modo autoteste: células escondidas até clicar. */
  esconder?: boolean
  onFechar?: () => void
  /** Janela flutuante em que a tabela está (undefined = na própria página). */
  janela?: string
  /** Mostrar os botões "destacar" e "comparar". */
  acoes?: boolean
}

export function TabelaParadigma({ p, destacar = true, esconder = false, onFechar, janela, acoes = true }: Props) {
  const [reveladas, setReveladas] = useState<Set<string>>(new Set())
  const revelar = (k: string) => setReveladas(r => new Set(r).add(k))
  const j = useJanelas()
  // Arrastar a tabela pela barra de título: solta numa janela flutuante para juntar as duas;
  // solta em qualquer outro lugar para tirá-la numa janela própria ali mesmo.
  const inicioArraste = (e: React.DragEvent) => {
    e.dataTransfer.setData(TIPO_ARRASTE, JSON.stringify({ tabela: p.id, de: janela ?? null } satisfies Arraste))
    e.dataTransfer.setData('text/plain', p.titulo)
    e.dataTransfer.effectAllowed = 'move'
  }
  const fimArraste = (e: React.DragEvent) => {
    if (location.hash.startsWith('#/janela')) return // na janela própria do navegador não há janelas flutuantes
    if (e.dataTransfer.dropEffect !== 'none' || (!e.clientX && !e.clientY)) return
    const perto = { x: e.clientX, y: e.clientY }
    if (janela) j.destacar(p.id, janela, perto)
    else j.abrir([p.id], perto)
  }
  return (
    <figure className="paradigma">
      <figcaption draggable onDragStart={inicioArraste} onDragEnd={fimArraste} title="Arraste para uma janela de tabelas ou para fora, para destacá-la">
        <span className="alca" aria-hidden>⠿</span>
        <span className="paradigma-titulo">{p.titulo}</span>
        {acoes && !janela && <>
          <button className="icone" onClick={() => j.abrir([p.id])} title="Destacar numa janela flutuante" aria-label="Destacar tabela">⧉</button>
          <button className="icone" onClick={() => j.acrescentar(p.id)} title="Comparar: acrescentar à janela de tabelas da frente (até 5)" aria-label="Comparar tabela">＋</button>
        </>}
        {onFechar && <button className="fechar" onClick={onFechar} aria-label="Fechar tabela">×</button>}
      </figcaption>
      <div className="paradigma-rolagem">
        <table>
          <thead><tr><th />{p.colunas.map(c => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {p.linhas.map((l, i) => (
              <tr key={i}>
                <th scope="row">{l.rotulo}</th>
                {l.celulas.map((c, j) => {
                  const k = `${i}:${j}`
                  const oculto = esconder && !reveladas.has(k) && c !== '—'
                  return (
                    <td key={j} className={`gr ${oculto ? 'oculto' : ''}`} onClick={() => oculto && revelar(k)}>
                      {oculto ? '?' : <Forma f={c} destacar={destacar} />}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {p.nota && <p className="nota">{p.nota}</p>}
      <div className="fontes"><FonteTag fonte={p.jact} /> <FonteTag fonte={p.athenaze} /></div>
    </figure>
  )
}

function Forma({ f, destacar }: { f: string; destacar: boolean }) {
  return <>{f.split(/\s*\/\s*/).map((alt, i) => {
    const [tema, term] = alt.split('|')
    return <span key={i}>{i > 0 && ' / '}{tema}{term != null && (destacar ? <b className="term">{term}</b> : term)}</span>
  })}</>
}

// Prática de escrita: o aluno desenha por cima da letra-modelo (com o dedo, a caneta ou o mouse)
// e o programa diz quanto do traçado cobriu e quanto saiu dele.
import { useRef, useState } from 'react'
import { Pauta } from './LetraAnimada'

type Ponto = { x: number; y: number }

/** Pontos ao longo dos traços do modelo, a cada 2 unidades. */
function amostrar(tracos: string[]): Ponto[] {
  // Medir um caminho exige que ele esteja na página: um SVG invisível, só durante a medição.
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('style', 'position:absolute;width:0;height:0;visibility:hidden')
  document.body.appendChild(svg)
  const pts: Ponto[] = []
  for (const d of tracos) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p.setAttribute('d', d); svg.appendChild(p)
    const n = p.getTotalLength()
    for (let s = 0; s <= n; s += 2) { const q = p.getPointAtLength(s); pts.push({ x: q.x, y: q.y }) }
  }
  svg.remove()
  return pts
}
const dist = (a: Ponto, b: Ponto) => Math.hypot(a.x - b.x, a.y - b.y)

export function Pratica({ tracos, rotulo }: { tracos: string[]; rotulo: string }) {
  const svg = useRef<SVGSVGElement>(null)
  const [riscos, setRiscos] = useState<Ponto[][]>([])
  const [resultado, setResultado] = useState<{ cobertura: number; fora: number } | null>(null)
  const desenhando = useRef(false)

  const ponto = (ev: React.PointerEvent): Ponto => {
    const m = svg.current!.getScreenCTM()!.inverse()
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m)
    return { x: p.x, y: p.y }
  }
  const comecar = (ev: React.PointerEvent) => {
    ev.preventDefault()
    svg.current!.setPointerCapture(ev.pointerId)
    desenhando.current = true
    setResultado(null)
    setRiscos(r => [...r, [ponto(ev)]])
  }
  const mover = (ev: React.PointerEvent) => {
    if (!desenhando.current) return
    const p = ponto(ev)
    setRiscos(r => {
      const ult = r[r.length - 1]
      if (dist(ult[ult.length - 1], p) < 1.2) return r
      return [...r.slice(0, -1), [...ult, p]]
    })
  }
  const terminar = () => { desenhando.current = false }

  const avaliar = () => {
    const modelo = amostrar(tracos)
    const tinta = riscos.flat()
    if (tinta.length < 3) return setResultado({ cobertura: 0, fora: 0 })
    const cobertura = modelo.filter(m => tinta.some(t => dist(m, t) < 9)).length / modelo.length
    const fora = tinta.filter(t => !modelo.some(m => dist(m, t) < 12)).length / tinta.length
    setResultado({ cobertura, fora })
  }
  const nota = resultado && (resultado.cobertura >= .85 && resultado.fora <= .15 ? 'Muito bem! 🎉'
    : resultado.cobertura >= .6 ? 'Quase lá: siga mais de perto a letra clarinha.'
    : 'Tente de novo: comece no ponto 1 e siga a forma da letra.')

  return (
    <div className="pratica">
      <svg ref={svg} viewBox="-6 -8 112 136" className="pratica-area" role="img" aria-label={`Escreva ${rotulo} por cima do modelo`}
        onPointerDown={comecar} onPointerMove={mover} onPointerUp={terminar} onPointerCancel={terminar}>
        <Pauta />
        {tracos.map((d, i) => <path key={i} d={d} className="modelo" />)}
        {riscos.map((r, i) => <polyline key={i} points={r.map(p => `${p.x},${p.y}`).join(' ')} className="tinta" />)}
      </svg>
      <div className="pratica-botoes">
        <button className="botao" onClick={avaliar} disabled={!riscos.length}>Conferir</button>
        <button className="botao secundario" onClick={() => { setRiscos([]); setResultado(null) }}>Apagar</button>
      </div>
      {resultado && (
        <p className="pratica-nota" role="status">
          <b>{nota}</b> Você cobriu {Math.round(resultado.cobertura * 100)}% do traçado
          {resultado.fora > .05 && <> ({Math.round(resultado.fora * 100)}% da tinta ficou fora)</>}.
        </p>
      )}
    </div>
  )
}

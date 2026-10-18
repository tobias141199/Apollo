// Prática de escrita: o aluno escreve por cima do modelo (a maiúscula e a minúscula, lado a lado),
// com o dedo, a caneta ou o mouse. "Conferir" mede, para cada forma, quanto do traçado foi coberto
// e quanto da tinta saiu dele. Passar aqui conta para a Lição 0 (é preciso escrever todas as letras).
import { useRef, useState } from 'react'
import { PASSO, Pauta, viewBox } from './LetraAnimada'

type Ponto = { x: number; y: number }

/** Exigência para considerar a letra escrita. */
export const MIN_COBERTURA = 0.8
export const MAX_FORA = 0.2

/** Pontos ao longo dos traços do modelo, a cada 2 unidades, já na posição da forma. */
function amostrar(tracos: string[], dx: number): Ponto[] {
  // Medir um caminho exige que ele esteja na página: um SVG invisível, só durante a medição.
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('style', 'position:absolute;width:0;height:0;visibility:hidden')
  document.body.appendChild(svg)
  const pts: Ponto[] = []
  for (const d of tracos) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p.setAttribute('d', d); svg.appendChild(p)
    const n = p.getTotalLength()
    for (let s = 0; s <= n; s += 2) { const q = p.getPointAtLength(s); pts.push({ x: q.x + dx, y: q.y }) }
  }
  svg.remove()
  return pts
}
const dist = (a: Ponto, b: Ponto) => Math.hypot(a.x - b.x, a.y - b.y)

interface Resultado { coberturas: number[]; fora: number; passou: boolean }

export function Pratica({ formas, nomes, rotulo, aoPassar }: {
  formas: string[][]; nomes: string[]; rotulo: string; aoPassar?: () => void
}) {
  const svg = useRef<SVGSVGElement>(null)
  const [riscos, setRiscos] = useState<Ponto[][]>([])
  const [resultado, setResultado] = useState<Resultado | null>(null)
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
    const modelos = formas.map((f, k) => amostrar(f, k * PASSO))
    const todos = modelos.flat()
    const tinta = riscos.flat()
    const coberturas = modelos.map(m => tinta.length < 3 ? 0 : m.filter(a => tinta.some(t => dist(a, t) < 9)).length / m.length)
    const fora = tinta.length ? tinta.filter(t => !todos.some(m => dist(m, t) < 12)).length / tinta.length : 0
    const passou = coberturas.every(c => c >= MIN_COBERTURA) && fora <= MAX_FORA
    setResultado({ coberturas, fora, passou })
    if (passou) aoPassar?.()
  }
  const faltando = resultado?.coberturas.map((c, i) => c < MIN_COBERTURA ? nomes[i] : null).filter(Boolean) ?? []

  return (
    <div className="pratica">
      <svg ref={svg} viewBox={viewBox(formas.length)} className="pratica-area" role="img" aria-label={`Escreva ${rotulo} por cima do modelo`}
        onPointerDown={comecar} onPointerMove={mover} onPointerUp={terminar} onPointerCancel={terminar}>
        <Pauta n={formas.length} />
        {formas.map((f, k) => f.map((d, i) => <path key={`${k}-${i}`} d={d} transform={`translate(${k * PASSO} 0)`} className="modelo" />))}
        {riscos.map((r, i) => <polyline key={i} points={r.map(p => `${p.x},${p.y}`).join(' ')} className="tinta" />)}
      </svg>
      <div className="pratica-botoes">
        <button className="botao" onClick={avaliar} disabled={!riscos.length}>Conferir</button>
        <button className="botao secundario" onClick={() => { setRiscos([]); setResultado(null) }}>Apagar</button>
      </div>
      {resultado && (
        <p className={`pratica-nota ${resultado.passou ? 'ok' : ''}`} role="status">
          {resultado.passou
            ? <><b>Muito bem!</b> As duas formas estão escritas.</>
            : <><b>Ainda não.</b> {faltando.length
                ? <>Siga mais de perto {faltando.length > 1 ? 'as letras clarinhas' : <>a {faltando[0]}</>}, começando no ponto 1.</>
                : <>Boa parte da tinta ficou fora das letras ({Math.round(resultado.fora * 100)}%). Escreva por cima do modelo.</>}</>}
          {' '}<span className="pratica-detalhe">
            {resultado.coberturas.map((c, i) => `${nomes[i]}: ${Math.round(c * 100)}%`).join(' · ')}
          </span>
        </p>
      )}
    </div>
  )
}

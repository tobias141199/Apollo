// Uma letra minúscula desenhada traço por traço: a "caneta" (um ponto) percorre cada traço na ordem,
// e cada traço mostra o ponto de partida numerado (S₁, S₂…) e uma setinha com a direção.
// Com `prefers-reduced-motion`, a letra aparece inteira, só com os números e as setas.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export const PAUTA = [0, 40, 80, 120] // topo das altas, topo das baixas, linha de base, fim das que descem

interface Marca { x: number; y: number; angulo: number }

export function Pauta({ larga = false }: { larga?: boolean }) {
  return (
    <g className="pauta" aria-hidden>
      {PAUTA.map(y => <line key={y} x1={larga ? -20 : 0} x2={larga ? 120 : 100} y1={y} y2={y} className={y === 80 ? 'base' : ''} />)}
    </g>
  )
}

const semMovimento = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * `tocar` muda (por exemplo, um contador) para reiniciar a animação. `velocidade` 1 = normal.
 * `aoTerminar` é chamado quando o último traço acaba.
 */
export function LetraAnimada({ tracos, tocar = 0, velocidade = 1, rotulo, aoTerminar, compacta = false }: {
  tracos: string[]; tocar?: number; velocidade?: number; rotulo: string; aoTerminar?: () => void; compacta?: boolean
}) {
  const caminhos = useRef<(SVGPathElement | null)[]>([])
  const caneta = useRef<SVGCircleElement>(null)
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [atual, setAtual] = useState(-1) // traço sendo desenhado (-1 = parado)

  // Ponto de partida e direção de cada traço (precisa do caminho já desenhado para medir).
  useLayoutEffect(() => {
    setMarcas(caminhos.current.map(p => {
      if (!p) return { x: 0, y: 0, angulo: 0 }
      const a = p.getPointAtLength(0), b = p.getPointAtLength(Math.min(7, p.getTotalLength()))
      return { x: a.x, y: a.y, angulo: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI }
    }))
  }, [tracos])

  const animar = useCallback(() => {
    const ps = caminhos.current.filter((p): p is SVGPathElement => !!p)
    let cancelado = false
    const animacoes: Animation[] = []
    if (semMovimento()) {
      for (const p of ps) { p.style.strokeDasharray = ''; p.style.strokeDashoffset = '' }
      aoTerminar?.()
      return () => {}
    }
    // Esconde todos os traços antes de começar.
    for (const p of ps) { const n = p.getTotalLength(); p.style.strokeDasharray = `${n}`; p.style.strokeDashoffset = `${n}` }
    ;(async () => {
      await new Promise(r => setTimeout(r, 250))
      for (let i = 0; i < ps.length && !cancelado; i++) {
        const p = ps[i], n = p.getTotalLength()
        const duracao = (450 + n * 9) / velocidade
        setAtual(i)
        const anim = p.animate([{ strokeDashoffset: n }, { strokeDashoffset: 0 }], { duration: duracao, easing: 'linear', fill: 'forwards' })
        animacoes.push(anim)
        // A caneta segue a ponta do traço.
        const seguir = () => {
          if (cancelado || !caneta.current) return
          const t = Math.min(1, (Number(anim.currentTime) || 0) / duracao)
          const pt = p.getPointAtLength(n * t)
          caneta.current.setAttribute('cx', String(pt.x)); caneta.current.setAttribute('cy', String(pt.y))
          if (t < 1) requestAnimationFrame(seguir)
        }
        requestAnimationFrame(seguir)
        await anim.finished.catch(() => {})
        await new Promise(r => setTimeout(r, 300 / velocidade))
      }
      if (!cancelado) { setAtual(-1); aoTerminar?.() }
    })()
    return () => { cancelado = true; animacoes.forEach(a => a.cancel()) }
  }, [velocidade, aoTerminar])

  useEffect(() => animar(), [tocar, tracos, animar])

  return (
    <svg viewBox="-6 -8 112 136" className={`letra-animada ${compacta ? 'compacta' : ''}`} role="img" aria-label={`Como escrever ${rotulo}`}>
      <Pauta />
      {/* a letra inteira, bem clara, por baixo: mostra aonde a caneta vai */}
      {tracos.map((d, i) => <path key={`f${i}`} d={d} className="traco-fantasma" />)}
      {tracos.map((d, i) => <path key={i} ref={el => { caminhos.current[i] = el }} d={d} className={`traco traco-${i}`} />)}
      {!compacta && marcas.map((m, i) => (
        <g key={i} className={`marca-inicio ${atual === i ? 'ativa' : ''}`}>
          <g transform={`translate(${m.x} ${m.y}) rotate(${m.angulo})`}>
            <path d="M15 0 L8.5 -3.8 L8.5 3.8 Z" className="seta" />
          </g>
          <circle cx={m.x} cy={m.y} r="5.5" />
          <text x={m.x} y={m.y + 2.6} textAnchor="middle">{i + 1}</text>
        </g>
      ))}
      <circle ref={caneta} r="4.5" className={`caneta ${atual >= 0 ? 'visivel' : ''}`} cx="-20" cy="-20" />
    </svg>
  )
}

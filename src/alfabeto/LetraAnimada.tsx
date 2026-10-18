// Letras desenhadas traço por traço: a "caneta" (um ponto) percorre cada traço na ordem, e cada
// traço mostra o ponto de partida numerado (S₁, S₂…) e uma setinha com a direção.
// Recebe uma ou mais formas (ex.: a maiúscula e a minúscula), lado a lado na mesma pauta, desenhadas
// uma depois da outra. Com `prefers-reduced-motion`, as letras aparecem inteiras, com números e setas.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export const PAUTA = [0, 40, 80, 120] // topo das altas, topo das baixas, linha de base, fim das que descem
/** Distância entre uma forma e a seguinte (cada letra ocupa 100 de largura). */
export const PASSO = 112

/** Área de desenho para `n` formas lado a lado. */
export const viewBox = (n: number) => `-6 -8 ${PASSO * (n - 1) + 112} 136`

export function Pauta({ n = 1 }: { n?: number }) {
  return (
    <g className="pauta" aria-hidden>
      {PAUTA.map(y => <line key={y} x1={-4} x2={PASSO * (n - 1) + 104} y1={y} y2={y} className={y === 80 ? 'base' : ''} />)}
    </g>
  )
}

interface Marca { x: number; y: number; angulo: number; numero: number }

const semMovimento = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * `formas`: os traços de cada forma (ex.: [maiúscula, minúscula]). `tocar` muda (um contador) para
 * reiniciar a animação. `velocidade` 1 = normal.
 */
export function LetraAnimada({ formas, tocar = 0, velocidade = 1, rotulo, compacta = false }: {
  formas: string[][]; tocar?: number; velocidade?: number; rotulo: string; compacta?: boolean
}) {
  // Todos os traços, na ordem, com o deslocamento horizontal da forma a que pertencem.
  const tracos = formas.flatMap((f, k) => f.map((d, i) => ({ d, dx: k * PASSO, numero: i + 1, chave: `${k}-${i}` })))
  const assinatura = tracos.map(t => t.d).join('|')
  const caminhos = useRef<(SVGPathElement | null)[]>([])
  const caneta = useRef<SVGCircleElement>(null)
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [atual, setAtual] = useState(-1)

  useLayoutEffect(() => {
    const ms: Marca[] = []
    tracos.forEach((t, i) => {
      const p = caminhos.current[i]
      if (!p) return ms.push({ x: 0, y: 0, angulo: 0, numero: t.numero })
      const a = p.getPointAtLength(0), b = p.getPointAtLength(Math.min(7, p.getTotalLength()))
      const angulo = Math.atan2(b.y - a.y, b.x - a.x)
      let x = a.x + t.dx, y = a.y
      // Dois traços que começam no mesmo ponto (ex.: Α): o número do segundo vai para o lado,
      // para não esconder o primeiro.
      for (let lado = 1; ms.some(m => Math.hypot(m.x - x, m.y - y) < 9); lado++) x += lado % 2 ? 11 : -22
      ms.push({ x, y, angulo: angulo * 180 / Math.PI, numero: t.numero })
    })
    setMarcas(ms)
  }, [assinatura])

  const animar = useCallback(() => {
    const ps = caminhos.current.slice(0, tracos.length).filter((p): p is SVGPathElement => !!p)
    let cancelado = false
    const animacoes: Animation[] = []
    if (semMovimento()) {
      for (const p of ps) { p.style.strokeDasharray = ''; p.style.strokeDashoffset = '' }
      return () => {}
    }
    for (const p of ps) { const n = p.getTotalLength(); p.style.strokeDasharray = `${n}`; p.style.strokeDashoffset = `${n}` }
    ;(async () => {
      await new Promise(r => setTimeout(r, 250))
      for (let i = 0; i < ps.length && !cancelado; i++) {
        const p = ps[i], n = p.getTotalLength(), dx = tracos[i].dx
        const duracao = (450 + n * 9) / velocidade
        setAtual(i)
        const anim = p.animate([{ strokeDashoffset: n }, { strokeDashoffset: 0 }], { duration: duracao, easing: 'linear', fill: 'forwards' })
        animacoes.push(anim)
        const seguir = () => {
          if (cancelado || !caneta.current) return
          const t = Math.min(1, (Number(anim.currentTime) || 0) / duracao)
          const pt = p.getPointAtLength(n * t)
          caneta.current.setAttribute('cx', String(pt.x + dx)); caneta.current.setAttribute('cy', String(pt.y))
          if (t < 1) requestAnimationFrame(seguir)
        }
        requestAnimationFrame(seguir)
        await anim.finished.catch(() => {})
        // pausa maior ao passar da maiúscula para a minúscula
        const trocaDeForma = tracos[i + 1] && tracos[i + 1].dx !== dx
        await new Promise(r => setTimeout(r, (trocaDeForma ? 650 : 300) / velocidade))
      }
      if (!cancelado) setAtual(-1)
    })()
    return () => { cancelado = true; animacoes.forEach(a => a.cancel()) }
  }, [velocidade, assinatura])

  useEffect(() => animar(), [tocar, animar])

  return (
    <svg viewBox={viewBox(formas.length)} className={`letra-animada ${compacta ? 'compacta' : ''}`} role="img" aria-label={`Como escrever ${rotulo}`}>
      <Pauta n={formas.length} />
      {tracos.map(t => <path key={`f${t.chave}`} d={t.d} transform={`translate(${t.dx} 0)`} className="traco-fantasma" />)}
      {tracos.map((t, i) => (
        <path key={t.chave} ref={el => { caminhos.current[i] = el }} d={t.d} transform={`translate(${t.dx} 0)`} className={`traco traco-${t.numero - 1}`} />
      ))}
      {!compacta && marcas.map((m, i) => (
        <g key={i} className={`marca-inicio ${atual === i ? 'ativa' : ''}`}>
          <g transform={`translate(${m.x} ${m.y}) rotate(${m.angulo})`}>
            <path d="M15 0 L8.5 -3.8 L8.5 3.8 Z" className="seta" />
          </g>
          <circle cx={m.x} cy={m.y} r="5.5" />
          <text x={m.x} y={m.y + 2.6} textAnchor="middle">{m.numero}</text>
        </g>
      ))}
      <circle ref={caneta} r="4.5" className={`caneta ${atual >= 0 ? 'visivel' : ''}`} cx="-20" cy="-20" />
    </svg>
  )
}

import { useRef, useState } from 'react'
import { paradigmaPorId } from '../content'
import { abrirJanelaPropria, MAX_TABELAS, TIPO_ARRASTE, useJanelas, type Arraste, type Janela } from '../lib/janelas'
import { EscolhaTabela } from './EscolhaTabela'
import { TabelaParadigma } from './TabelaParadigma'

const nomeCurto = (id: string) => paradigmaPorId.get(id)?.titulo.replace(/\s*\(.*?\)\s*$/, '').replace(/\s—.*$/, '') ?? id

/** Todas as janelas flutuantes abertas, mais a "doca" com as minimizadas. Fica fora das rotas. */
export function CamadaJanelas() {
  const { janelas, trazer } = useJanelas()
  const minimizadas = janelas.filter(j => j.minimizada)
  return (
    <>
      {janelas.filter(j => !j.minimizada).map(j => <JanelaFlutuante key={j.id} j={j} />)}
      {minimizadas.length > 0 && (
        <div className="doca" aria-label="Janelas de tabelas minimizadas">
          {minimizadas.map(j => (
            <button key={j.id} className="doca-item" onClick={() => trazer(j.id)} title="Restaurar">
              ▣ {nomeCurto(j.tabelas[0])}{j.tabelas.length > 1 && ` +${j.tabelas.length - 1}`}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/** Uma janela que se arrasta pela barra de título e se redimensiona pelo canto. */
function JanelaFlutuante({ j }: { j: Janela }) {
  const { atualizar, fechar, trazer, moverTabela } = useJanelas()
  const [destacar, setDestacar] = useState(true)
  const [recebendo, setRecebendo] = useState(false)
  const arraste = useRef<{ dx: number; dy: number; modo: 'mover' | 'redimensionar' } | null>(null)

  const limitar = (x: number, y: number) => ({
    x: Math.min(Math.max(x, 8 - j.w + 120), window.innerWidth - 120),
    y: Math.min(Math.max(y, 0), window.innerHeight - 40),
  })
  const iniciar = (modo: 'mover' | 'redimensionar') => (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, select, input')) return
    e.preventDefault()
    trazer(j.id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    arraste.current = modo === 'mover'
      ? { modo, dx: e.clientX - j.x, dy: e.clientY - j.y }
      : { modo, dx: e.clientX - j.w, dy: e.clientY - j.h }
  }
  const mover = (e: React.PointerEvent) => {
    const a = arraste.current
    if (!a) return
    if (a.modo === 'mover') atualizar(j.id, limitar(e.clientX - a.dx, e.clientY - a.dy))
    else atualizar(j.id, { w: Math.max(260, e.clientX - a.dx), h: Math.max(160, e.clientY - a.dy) })
  }
  const soltar = () => { arraste.current = null }

  const aceita = (e: React.DragEvent) => e.dataTransfer.types.includes(TIPO_ARRASTE) && j.tabelas.length < MAX_TABELAS
  const aoSoltar = (e: React.DragEvent) => {
    setRecebendo(false)
    const bruto = e.dataTransfer.getData(TIPO_ARRASTE)
    if (!bruto) return
    e.preventDefault()
    const { tabela, de } = JSON.parse(bruto) as Arraste
    moverTabela(tabela, de, j.id)
  }

  return (
    <section
      className={`janela ${recebendo ? 'recebendo' : ''}`}
      style={{ left: j.x, top: j.y, width: j.w, height: j.h, zIndex: 100 + j.z }}
      onPointerDown={() => trazer(j.id)}
      onDragOver={e => { if (aceita(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setRecebendo(true) } }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setRecebendo(false) }}
      onDrop={aoSoltar}
      aria-label="Janela de tabelas"
    >
      <header className="janela-barra" onPointerDown={iniciar('mover')} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}>
        <span className="janela-titulo">{j.tabelas.map(nomeCurto).join(' · ')}</span>
        <label className="check mini" title="Destacar terminações">
          <input type="checkbox" checked={destacar} onChange={e => setDestacar(e.target.checked)} /> term.
        </label>
        {j.tabelas.length < MAX_TABELAS && (
          <EscolhaTabela excluir={j.tabelas} onEscolher={id => atualizar(j.id, { tabelas: [...j.tabelas, id], w: Math.max(j.w, Math.min(window.innerWidth - 16, 40 + (j.tabelas.length + 1) * 300)) })} />
        )}
        <button className="icone" onClick={() => abrirJanelaPropria(j.tabelas)} title="Abrir numa janela própria do navegador" aria-label="Abrir em janela própria">⧉</button>
        <button className="icone" onClick={() => atualizar(j.id, { minimizada: true })} title="Minimizar" aria-label="Minimizar">–</button>
        <button className="icone" onClick={() => fechar(j.id)} title="Fechar" aria-label="Fechar janela">×</button>
      </header>
      <div className="janela-corpo lado-a-lado">
        {j.tabelas.map(id => {
          const p = paradigmaPorId.get(id)
          return p && <TabelaParadigma key={id} p={p} janela={j.id} destacar={destacar}
            onFechar={() => j.tabelas.length > 1 ? atualizar(j.id, { tabelas: j.tabelas.filter(t => t !== id) }) : fechar(j.id)} />
        })}
        {recebendo && <div className="dica-soltar">Solte para juntar a esta janela</div>}
      </div>
      <div className="janela-canto" onPointerDown={iniciar('redimensionar')} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar} aria-hidden />
    </section>
  )
}

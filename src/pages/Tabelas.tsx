import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { paradigmaPorId, paradigmas } from '../content'
import { TabelaParadigma } from '../components/TabelaParadigma'
import { abrirJanelaPropria, MAX_TABELAS, useJanelas } from '../lib/janelas'

const GRUPOS = [['artigo', 'Artigo'], ['substantivo', 'Substantivos'], ['adjetivo', 'Adjetivos'], ['pronome', 'Pronomes'], ['verbo', 'Verbos']] as const

/** Paradigmas lado a lado. A seleção fica na URL (?t=artigo,decl2-masc) para poder salvar/compartilhar. */
export function Tabelas() {
  const [params, setParams] = useSearchParams()
  const ids = (params.get('t') ?? 'artigo,decl2-masc').split(',').filter(id => paradigmaPorId.has(id)).slice(0, MAX_TABELAS)
  const cheio = ids.length >= MAX_TABELAS
  const { abrir } = useJanelas()
  const definir = (novo: string[]) => setParams({ t: novo.join(',') }, { replace: true })
  const alternar = (id: string) => definir(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  const [destacar, setDestacar] = useState(true)
  const [esconder, setEsconder] = useState(false)
  const [chaveEsconder, setChaveEsconder] = useState(0)

  return (
    <div className="pagina larga">
      <h1>Tabelas</h1>
      <p className="sub">
        Escolha até {MAX_TABELAS} paradigmas e compare-os lado a lado. No modo autoteste, clique em cada “?” para revelar.
        Com <b>⧉</b> a seleção vira uma janela flutuante, que continua aberta enquanto você navega pelo app; arraste uma tabela
        pela barra de título para outra janela, ou para fora, para destacá-la.
      </p>
      <div className="escolha-tabelas">
        {GRUPOS.map(([g, rot]) => {
          const doGrupo = paradigmas.filter(p => p.grupo === g)
          if (!doGrupo.length) return null
          return (
            <div key={g} className="grupo-tabelas">
              <span className="rotulo">{rot}</span>
              {doGrupo.map(p => (
                <button key={p.id} className={`pilula ${ids.includes(p.id) ? 'ativa' : ''}`} onClick={() => alternar(p.id)}
                  disabled={cheio && !ids.includes(p.id)} title={cheio && !ids.includes(p.id) ? `Máximo de ${MAX_TABELAS} tabelas` : undefined}>
                  {p.titulo.replace(/\s*\(.*?\)\s*$/, '')}
                </button>
              ))}
            </div>
          )
        })}
      </div>
      <div className="barra">
        <label className="check"><input type="checkbox" checked={destacar} onChange={e => setDestacar(e.target.checked)} /> destacar terminações</label>
        <label className="check"><input type="checkbox" checked={esconder} onChange={e => { setEsconder(e.target.checked); setChaveEsconder(k => k + 1) }} /> autoteste (esconder formas)</label>
        {esconder && <button className="link" onClick={() => setChaveEsconder(k => k + 1)}>esconder de novo</button>}
        {ids.length > 0 && <button className="link" onClick={() => definir([])}>limpar</button>}
        <span className="nota-mini">{ids.length}/{MAX_TABELAS}</span>
        {ids.length > 0 && <>
          <button className="botao" onClick={() => abrir(ids)} title="Abrir a seleção numa janela flutuante">⧉ janela flutuante</button>
          <button className="botao" onClick={() => abrirJanelaPropria(ids)} title="Abrir a seleção numa janela do navegador">⧉ janela própria</button>
        </>}
      </div>
      <div className="lado-a-lado">
        {ids.map(id => (
          <TabelaParadigma key={`${id}-${chaveEsconder}`} p={paradigmaPorId.get(id)!} destacar={destacar} esconder={esconder} acoes={false} onFechar={() => alternar(id)} />
        ))}
      </div>
      {ids.length === 0 && <p className="vazio">Escolha uma ou mais tabelas acima.</p>}
    </div>
  )
}

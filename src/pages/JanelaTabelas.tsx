import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { paradigmaPorId } from '../content'
import { EscolhaTabela } from '../components/EscolhaTabela'
import { TabelaParadigma } from '../components/TabelaParadigma'
import { MAX_TABELAS } from '../lib/janelas'

/** Janela própria do navegador (aberta por "⧉"): só as tabelas, sem o resto do app. */
export function JanelaTabelas() {
  const [params, setParams] = useSearchParams()
  const ids = (params.get('t') ?? '').split(',').filter(id => paradigmaPorId.has(id)).slice(0, MAX_TABELAS)
  const definir = (novo: string[]) => setParams({ t: novo.join(',') }, { replace: true })
  const [destacar, setDestacar] = useState(true)
  useEffect(() => {
    document.title = ids.map(id => paradigmaPorId.get(id)!.titulo.replace(/\s*\(.*?\)\s*$/, '')).join(' · ') || 'Tabelas'
  }, [ids.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="janela-propria">
      <div className="barra">
        {ids.length < MAX_TABELAS && <EscolhaTabela excluir={ids} onEscolher={id => definir([...ids, id])} />}
        <label className="check"><input type="checkbox" checked={destacar} onChange={e => setDestacar(e.target.checked)} /> destacar terminações</label>
        <span className="nota-mini">{ids.length}/{MAX_TABELAS} tabelas</span>
      </div>
      <div className="lado-a-lado">
        {ids.map(id => (
          <TabelaParadigma key={id} p={paradigmaPorId.get(id)!} destacar={destacar} acoes={false} onFechar={() => definir(ids.filter(x => x !== id))} />
        ))}
      </div>
      {ids.length === 0 && <p className="vazio">Escolha uma tabela no menu acima.</p>}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { paradigmaPorId } from '../content'
import { catalogo, COMPARACOES, primeiraLicao } from '../content/catalogoTabelas'
import { TabelaParadigma } from '../components/TabelaParadigma'
import { abrirJanelaPropria, MAX_TABELAS, useJanelas } from '../lib/janelas'
import { chave } from '../lib/greek'
import { estaLiberada, useProgresso } from '../lib/progresso'
import { Certo } from '../components/Icones'

const tituloCurto = (t: string) => t.replace(/\s*\(.*?\)\s*$/, '')

/**
 * Tabelas: à esquerda, o catálogo organizado como uma gramática (classe → subgrupo, na ordem da trilha);
 * à direita, as tabelas escolhidas, lado a lado. A seleção fica na URL (?t=artigo,decl2-masc).
 */
export function Tabelas() {
  const [params, setParams] = useSearchParams()
  const ids = (params.get('t') ?? '').split(',').filter(id => paradigmaPorId.has(id)).slice(0, MAX_TABELAS)
  const cheio = ids.length >= MAX_TABELAS
  const { abrir } = useJanelas()
  const prog = useProgresso()
  const definir = (novo: string[]) => setParams(novo.length ? { t: novo.join(',') } : {}, { replace: true })
  const alternar = (id: string) => definir(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  const [destacar, setDestacar] = useState(true)
  const [esconder, setEsconder] = useState(false)
  const [chaveEsconder, setChaveEsconder] = useState(0)
  const [busca, setBusca] = useState('')

  // A busca procura no título e nas formas da tabela (com ou sem acentos).
  const combina = useMemo(() => {
    const q = chave(busca)
    if (!q) return () => true
    return (id: string) => {
      const p = paradigmaPorId.get(id)!
      return chave(p.titulo).includes(q) || p.linhas.some(l => chave(l.rotulo).includes(q) || l.celulas.some(c => chave(c).includes(q)))
    }
  }, [busca])

  return (
    <div className="pagina larga tabelas">
      <h1>Tabelas</h1>
      <p className="sub">
        Todas as tabelas de flexão, organizadas como numa gramática. Escolha até {MAX_TABELAS} para comparar lado a lado;
        a etiqueta mostra em que lição cada uma aparece.
      </p>

      <div className="tabelas-layout">
        <aside className="catalogo">
          <input className="filtro" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar: dativo, λόγος, aoristo…" aria-label="Buscar tabela" />
          {catalogo.map(c => {
            const subs = c.subgrupos.map(s => ({ ...s, ids: s.ids.filter(combina) })).filter(s => s.ids.length)
            if (!subs.length) return null
            return (
              <details key={c.titulo} className="catalogo-categoria" open>
                <summary>{c.titulo} <small>{subs.reduce((n, s) => n + s.ids.length, 0)}</small></summary>
                {subs.map(s => (
                  <div key={s.titulo} className="catalogo-sub">
                    <span className="catalogo-sub-titulo">{s.titulo}</span>
                    <ul>
                      {s.ids.map(id => {
                        const p = paradigmaPorId.get(id)!
                        const l = primeiraLicao.get(id)
                        const adiante = l && !prog.aprovadas.has(l.id) && !estaLiberada(l.id, prog)
                        const ativa = ids.includes(id)
                        return (
                          <li key={id}>
                            <button className={`item-tabela ${ativa ? 'ativa' : ''} ${adiante ? 'adiante' : ''}`} onClick={() => alternar(id)}
                              disabled={cheio && !ativa} aria-pressed={ativa}
                              title={cheio && !ativa ? `Máximo de ${MAX_TABELAS} tabelas` : adiante ? 'Aparece numa lição que você ainda não alcançou' : undefined}>
                              <span className="item-marca" aria-hidden>{ativa ? <Certo /> : '+'}</span>
                              <span className="item-titulo">{tituloCurto(p.titulo)}</span>
                              {l && <span className={`marca-livro livro-${l.livro.toLowerCase()}`}>{l.rotulo}</span>}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </details>
            )
          })}
        </aside>

        <section className="mesa">
          {ids.length > 0 ? (
            <>
              <div className="barra mesa-barra">
                <label className="check"><input type="checkbox" checked={destacar} onChange={e => setDestacar(e.target.checked)} /> destacar terminações</label>
                <label className="check"><input type="checkbox" checked={esconder} onChange={e => { setEsconder(e.target.checked); setChaveEsconder(k => k + 1) }} /> autoteste (esconder formas)</label>
                {esconder && <button className="link" onClick={() => setChaveEsconder(k => k + 1)}>esconder de novo</button>}
                <span className="nota-mini">{ids.length}/{MAX_TABELAS}</span>
                <button className="link" onClick={() => definir([])}>limpar</button>
                <button className="botao secundario" onClick={() => abrir(ids)} title="Abrir numa janela flutuante, que continua aberta ao trocar de página">⧉ janela flutuante</button>
                <button className="botao secundario" onClick={() => abrirJanelaPropria(ids)} title="Abrir numa janela do navegador">⧉ janela própria</button>
              </div>
              <div className="lado-a-lado">
                {ids.map(id => (
                  <TabelaParadigma key={`${id}-${chaveEsconder}`} p={paradigmaPorId.get(id)!} destacar={destacar} esconder={esconder} acoes={false} onFechar={() => alternar(id)} />
                ))}
              </div>
            </>
          ) : (
            <div className="mesa-vazia">
              <p>Escolha tabelas no catálogo ao lado, ou comece por uma destas comparações:</p>
              <div className="comparacoes">
                {COMPARACOES.map(c => (
                  <button key={c.titulo} className="comparacao" onClick={() => definir(c.ids.filter(id => paradigmaPorId.has(id)).slice(0, MAX_TABELAS))}>
                    <b>{c.titulo}</b>
                    <span className="gr">{c.ids.map(id => paradigmaPorId.get(id)?.titulo.match(/[\u0370-\u03ff\u1f00-\u1fff]+/)?.[0]).filter(Boolean).join(' · ')}</span>
                  </button>
                ))}
              </div>
              <p className="nota-mini">Dica: no modo autoteste as formas ficam escondidas; clique em cada “?” para conferir. Dentro de cada lição, a aba
                Gramática mostra só as tabelas daquela lição. <Link to="/trilha">Ir para a trilha</Link></p>
            </div>
          )}
          {ids.length > 0 && (
            <p className="comparacoes-mini">
              Comparações prontas:{' '}
              {COMPARACOES.map(c => <button key={c.titulo} className="pilula" onClick={() => definir(c.ids.filter(id => paradigmaPorId.has(id)).slice(0, MAX_TABELAS))}>{c.titulo}</button>)}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

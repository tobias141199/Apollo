import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { entradaPorChave, licaoPorId, licoes, paradigmaPorId, passosTrilha, trilha, type Licao } from '../content'
import type { Exercicio, Vocab } from '../content/schema'
import { FonteTag } from '../components/FonteTag'
import { GregoInput } from '../components/GregoInput'
import { TabelaParadigma } from '../components/TabelaParadigma'
import { Avaliacao } from '../components/Avaliacao'
import { bloqueadaPor, estaLiberada, useProgresso } from '../lib/progresso'
import { db } from '../lib/db'
import { marcar } from '../lib/nuvem'
import { chave, ehGrego, respostaCorreta } from '../lib/greek'
import { Cadeado, Certo, Errado } from '../components/Icones'

type Aba = 'vocab' | 'gramatica' | 'texto' | 'exercicios' | 'cultura' | 'ponte' | 'avaliacao'

/** Página de uma lição: seção da JACT (/secao/1A) ou capítulo do Athenaze (/capitulo/3). */
export function LicaoPagina() {
  const params = useParams()
  const id = params.n ? `ath${params.n}` : params.id!
  const l = licaoPorId.get(id)
  const [aba, setAba] = useState<Aba>('vocab')
  const prog = useProgresso()
  useEffect(() => setAba(l?.emPreparacao ? 'ponte' : 'vocab'), [id, l?.emPreparacao])
  if (!l) return <div className="pagina"><p>Lição {id} não encontrada.</p></div>

  const outro = l.livro === 'JACT' ? 'Athenaze' : 'JACT'
  const abas: [Aba, string, number][] = [
    ['vocab', 'Vocabulário', l.vocab.length],
    ['gramatica', 'Gramática', l.gramatica.length],
    ['texto', l.livro === 'Athenaze' ? 'Leituras' : 'Texto', l.textos.length],
    ['exercicios', 'Exercícios', l.exercicios.length],
    ['cultura', 'Cultura', l.cultura ? 1 : 0],
    ['ponte', `Ponte com ${outro}`, l.ponte ? 1 : 0],
    ['avaliacao', 'Avaliação', l.emPreparacao ? 0 : 1],
  ]
  const liberada = estaLiberada(l.id, prog)
  const trava = passosTrilha.find(p => p.licao.id === bloqueadaPor(l.id, prog))?.licao
  const registro = prog.avaliacoes[l.id]
  const contaveis: Aba[] = ['vocab', 'gramatica', 'texto', 'exercicios']

  return (
    <div className={`pagina licao licao-${l.livro.toLowerCase()}`}>
      <Migalhas l={l} />
      <h1>
        <span className={`id-secao livro-${l.livro.toLowerCase()}`}>{l.rotulo}</span>{' '}
        {l.tituloGrego && <span className="gr">{l.tituloGrego}</span>}
        {l.tituloGrego && l.titulo && ' · '}
        {l.titulo}
      </h1>
      {l.resumo && <p className="resumo">{l.resumo}</p>}
      <FonteTag fonte={l.fonte} />
      {!l.emPreparacao && (prog.aprovadas.has(l.id)
        ? <p className="situacao-licao ok"><Certo /> Aprovada{registro && ` · melhor nota ${Math.round(registro.melhor * 100)}%`}</p>
        : !liberada
          ? <p className="situacao-licao trancada"><Cadeado /> Lição ainda trancada: você pode lê-la, mas a avaliação só abre depois de passar em{' '}
              {trava ? <Link to={trava.rota}>{trava.rotulo}</Link> : 'nas lições anteriores'}.</p>
          : <p className="situacao-licao">Ao terminar, faça a <button className="link" onClick={() => setAba('avaliacao')}>avaliação</button> (70% para liberar a próxima lição).</p>)}

      {l.emPreparacao && (
        <p className="aviso">
          O conteúdo deste capítulo do Athenaze (vocabulário, leituras, gramática e exercícios) ainda está em preparação.
          Enquanto isso, veja na aba “Ponte” as seções da JACT que tratam do mesmo assunto.
        </p>
      )}

      <div className="abas" role="tablist">
        {abas.filter(([a, , n]) => n > 0 || (!l.emPreparacao && ['vocab', 'gramatica'].includes(a))).map(([a, rot, n]) => (
          <button key={a} role="tab" aria-selected={aba === a} className={`${aba === a ? 'ativa' : ''} ${a === 'avaliacao' ? 'aba-avaliacao' : ''}`} onClick={() => setAba(a)} disabled={n === 0}>
            {a === 'avaliacao' && (prog.aprovadas.has(l.id) ? <><Certo />{' '}</> : !liberada && <><Cadeado />{' '}</>)}{rot}{n > 0 && contaveis.includes(a) && <small> {n}</small>}
          </button>
        ))}
      </div>

      {aba === 'vocab' && <AbaVocab l={l} />}
      {aba === 'gramatica' && <AbaGramatica l={l} />}
      {aba === 'exercicios' && l.exercicios.map(e => <ExercicioBloco key={e.id} licao={l.id} e={e} />)}
      {aba === 'texto' && l.textos.map((t, i) => (
        <section key={i} className="texto-grego">
          {t.titulo && <h3>{t.titulo}</h3>}
          {t.grego.split(/\n\n+/).map((p, j) => <p key={j} className="gr">{p}</p>)}
          <FonteTag fonte={t.fonte} />
        </section>
      ))}
      {aba === 'cultura' && l.cultura && (
        <section className="cultura">
          <h3>{l.cultura.titulo}</h3>
          <Texto t={l.cultura.resumo} />
          <FonteTag fonte={l.cultura.fonte} />
        </section>
      )}
      {aba === 'ponte' && <AbaPonte l={l} />}
      {aba === 'avaliacao' && <Avaliacao l={l} />}

      <AntProx l={l} />
    </div>
  )
}

function Migalhas({ l }: { l: Licao }) {
  const passo = passosTrilha.find(p => p.licao.id === l.id)
  return (
    <nav className="migalhas">
      <Link to="/trilha">Trilha</Link>
      {passo && <> › Etapa {passo.etapa}: {trilha.etapas[passo.etapa].titulo}</>}
      {' › '}{l.grupo}
    </nav>
  )
}

/** Anterior/próximo na trilha (principal) e dentro do mesmo livro (secundário). */
function AntProx({ l }: { l: Licao }) {
  const i = passosTrilha.findIndex(p => p.licao.id === l.id)
  const ant = passosTrilha[i - 1]?.licao, prox = passosTrilha[i + 1]?.licao
  const doLivro = licoes.filter(x => x.livro === l.livro).sort((a, b) => ordemNoLivro(a) - ordemNoLivro(b))
  const j = doLivro.indexOf(l)
  const antL = doLivro[j - 1], proxL = doLivro[j + 1]
  const rot = (x: Licao) => <><span className={`marca-livro livro-${x.livro.toLowerCase()}`}>{x.rotulo}</span> {x.tituloGrego ?? x.titulo ?? ''}</>
  return (
    <>
      <nav className="ant-prox">
        {ant ? <Link to={ant.rota}>‹ {rot(ant)}</Link> : <span />}
        <span className="rotulo">trilha</span>
        {prox ? <Link to={prox.rota}>{rot(prox)} ›</Link> : <span />}
      </nav>
      <nav className="ant-prox secundaria">
        {antL ? <Link to={antL.rota}>‹ {antL.rotulo}</Link> : <span />}
        <span className="rotulo">só {l.livro}</span>
        {proxL ? <Link to={proxL.rota}>{proxL.rotulo} ›</Link> : <span />}
      </nav>
    </>
  )
}
const ordemNoLivro = (x: Licao) => x.livro === 'Athenaze'
  ? +x.id.slice(3)
  : parseInt(x.id) * 100 + x.id.charCodeAt(x.id.length - 1)

/** Etiquetas das outras lições (do outro livro) onde a palavra também aparece. */
function OutrasOrigens({ v, l }: { v: Vocab; l: Licao }) {
  const e = entradaPorChave.get(chave(v.grego))
  const outras = (e?.origens ?? []).filter(o => licaoPorId.get(o.licaoId)?.livro !== l.livro)
  // Uma etiqueta só: a lição do outro livro em que a palavra é "a aprender" (ou a primeira em que aparece).
  const melhor = outras.find(o => o.aprender) ?? outras[0]
  return <>{(melhor ? [melhor] : []).map(o => {
    const x = licaoPorId.get(o.licaoId)!
    return <Link key={o.licaoId} to={x.rota} className={`fonte fonte-${x.livro === 'JACT' ? 'jact-textos' : 'athenaze'}`}>
      {x.livro === 'JACT' ? `JACT ${x.rotulo}` : `Athenaze cap. ${x.id.slice(3)}`}
    </Link>
  })}{!outras.length && l.livro === 'JACT' && v.athenaze && <span className="fonte fonte-athenaze">Athenaze {v.athenaze}</span>}</>
}

function AbaVocab({ l }: { l: Licao }) {
  const aprender = l.vocab.filter(v => v.aprender)
  const outras = l.vocab.filter(v => !v.aprender)
  const Linha = ({ v }: { v: Vocab }) => (
    <tr>
      <td className="gr lema"><Link to={`/palavra/${encodeURIComponent(chave(v.grego))}`}>{v.lexical ?? v.grego}</Link></td>
      <td>{v.glosa}{v.nota && <div className="nota-mini">{v.nota}</div>}</td>
      <td className="fonte-cel"><OutrasOrigens v={v} l={l} /></td>
    </tr>
  )
  return (
    <>
      <h2>{l.livro === 'JACT' ? 'Vocabulário a ser aprendido' : 'Vocabulário do capítulo'}</h2>
      <table className="lista-vocab"><tbody>{aprender.map(v => <Linha key={v.grego} v={v} />)}</tbody></table>
      {outras.length > 0 && (<>
        <h2>{l.livro === 'JACT' ? 'Outras palavras do texto' : 'Glosadas na leitura'}</h2>
        <table className="lista-vocab secundaria"><tbody>{outras.map(v => <Linha key={v.grego} v={v} />)}</tbody></table>
      </>)}
      {l.vocab[0] && <p><FonteTag fonte={l.vocab[0].fonte} /></p>}
    </>
  )
}

function AbaGramatica({ l }: { l: Licao }) {
  return <>{l.gramatica.map((g, i) => (
    <section key={i} className="gramatica">
      <h3>{g.topico}</h3>
      <div className="fontes"><FonteTag fonte={g.jact} /> <FonteTag fonte={g.athenaze} /></div>
      <Texto t={g.nota} />
      {g.exemplos?.map((c, j) => (
        <blockquote key={j} className="citacao">
          <p className="gr">{c.grego}</p>{c.traducao && <p className="trad">{c.traducao}</p>}
          {c.comentario && <p className="nota-mini">{c.comentario}</p>}
          <FonteTag fonte={c.fonte} />
        </blockquote>
      ))}
      {g.paradigmas && (
        <div className="grade-tabelas">
          {g.paradigmas.map(p => paradigmaPorId.get(p)).filter(Boolean).map(p => <TabelaParadigma key={p!.id} p={p!} />)}
        </div>
      )}
    </section>
  ))}</>
}

function AbaPonte({ l }: { l: Licao }) {
  const a = l.ponte
  if (!a) return null
  const outro = l.livro === 'JACT' ? 'o Athenaze' : 'a JACT'
  const noOutro = l.livro === 'JACT' ? 'no Athenaze' : 'na JACT'
  const corresp = a.correspondentes.map(id => licaoPorId.get(id)).filter((x): x is Licao => !!x)
  // Vocabulário dialético: o que esta lição tem em comum com as correspondentes e o que só o outro livro traz.
  const minhas = new Set(l.vocab.map(v => chave(v.grego)))
  const doOutro = new Map(corresp.flatMap(c => c.vocab.filter(v => v.aprender).map(v => [chave(v.grego), { v, c }] as const)))
  const comuns = [...doOutro.values()].filter(({ v }) => minhas.has(chave(v.grego)))
  const soOutro = [...doOutro.values()].filter(({ v }) => !minhas.has(chave(v.grego)))
  return (
    <section className="ponte">
      {corresp.length > 0 && (<>
        <h3>A mesma matéria {noOutro}</h3>
        <div className="cartoes-ponte">
          {corresp.map(c => (
            <Link key={c.id} to={c.rota} className={`cartao-licao livro-${c.livro.toLowerCase()} ${c.emPreparacao ? 'pendente' : ''}`}>
              <b>{c.rotulo}</b>
              <span>{c.tituloGrego && <span className="gr">{c.tituloGrego} </span>}{c.titulo}</span>
              <small>{c.emPreparacao ? 'em preparação' : `${c.vocab.filter(v => v.aprender).length} palavras · ${c.textos.length} textos`}</small>
            </Link>
          ))}
        </div>
      </>)}
      {a.comparacao && (<><h3>Os dois livros, lado a lado</h3><Texto t={a.comparacao} /></>)}
      {a.complementos.length > 0 && (<>
        <h3>O que {outro} acrescenta</h3>
        <ul>{a.complementos.map((c, i) => <li key={i}><Texto t={c} inline /></li>)}</ul>
      </>)}
      {(comuns.length > 0 || soOutro.length > 0) && (
        <div className="vocab-ponte">
          {comuns.length > 0 && <div>
            <h3>Vocabulário em comum <small>{comuns.length}</small></h3>
            <p className="nota-mini">Palavras que os dois livros ensinam aqui: revisão em dobro.</p>
            <ul className="lista-curta">{comuns.map(({ v }) => <li key={v.grego}><PalavraLink v={v} /></li>)}</ul>
          </div>}
          {soOutro.length > 0 && <div>
            <h3>Só {noOutro} <small>{soOutro.length}</small></h3>
            <p className="nota-mini">Vocabulário a mais, trazido pelas lições correspondentes.</p>
            <ul className="lista-curta">{soOutro.map(({ v, c }) => <li key={v.grego}><PalavraLink v={v} /> <span className="secao-mini">{c.rotulo}</span></li>)}</ul>
          </div>}
        </div>
      )}
      {a.citacoes.length > 0 && (<>
        <h3>Trechos lado a lado</h3>
        <div className="citacoes-grade">
          {a.citacoes.map((c, i) => (
            <blockquote key={i} className={`citacao citacao-${c.fonte.livro.toLowerCase()}`}>
              <p className="gr">{c.grego}</p>
              {c.traducao && <p className="trad">{c.traducao}</p>}
              {c.comentario && <p className="nota-mini">{c.comentario}</p>}
              <FonteTag fonte={c.fonte} />
            </blockquote>
          ))}
        </div>
      </>)}
    </section>
  )
}

function PalavraLink({ v }: { v: Vocab }) {
  return <><Link className="gr" to={`/palavra/${encodeURIComponent(chave(v.grego))}`}>{v.grego}</Link> <span className="glosa">{v.glosa}</span></>
}

/** Texto simples com parágrafos e *ênfase*; trechos gregos ganham a fonte grega. */
function Texto({ t, inline }: { t: string; inline?: boolean }) {
  const render = (par: string) => par.split(/(\*[^*]+\*)/).map((x, i) =>
    x.startsWith('*') && x.endsWith('*') ? <em key={i}>{x.slice(1, -1)}</em> : x)
  if (inline) return <>{render(t)}</>
  return <>{t.split(/\n\n+/).map((p, i) => <p key={i}>{render(p)}</p>)}</>
}

function ExercicioBloco({ licao, e }: { licao: string; e: Exercicio }) {
  const grego = ['traduzir-pg', 'morfologia', 'completar', 'transformar'].includes(e.tipo)
  return (
    <section className="exercicio">
      <h3>{e.titulo}</h3>
      <FonteTag fonte={e.fonte} />
      <p className="enunciado">{e.enunciado}</p>
      {e.gabarito === 'projeto' && <p className="nota-mini">Respostas sugeridas pelo projeto (não constam do livro).</p>}
      <ol>
        {e.itens.map((it, i) => <ItemExercicio key={i} id={`${licao}/${e.id}/${i}`} pergunta={it.pergunta} resposta={it.resposta} grego={grego} />)}
      </ol>
    </section>
  )
}

function ItemExercicio({ id, pergunta, resposta, grego }: { id: string; pergunta: string; resposta?: string; grego: boolean }) {
  const [txt, setTxt] = useState('')
  const [ver, setVer] = useState(false)
  useEffect(() => {
    db.respostas.where('exercicio').equals(id).last().then(r => r && setTxt(r.texto))
  }, [id])
  const salvar = (v: string) => { setTxt(v); db.respostas.add({ exercicio: id, texto: v, em: new Date() }).then(() => marcar('respostas', id)) }
  const certo = resposta && txt && ehGrego(resposta) ? respostaCorreta(txt, resposta) : null
  return (
    <li className="item-exercicio">
      <div className={ehGrego(pergunta) ? 'gr pergunta' : 'pergunta'}>{pergunta}</div>
      {grego
        ? <GregoInput value={txt} onChange={salvar} />
        : <textarea rows={2} value={txt} onChange={ev => salvar(ev.target.value)} placeholder="Sua resposta" />}
      {resposta && (
        <div className="gabarito">
          {certo != null && <span className={certo ? 'ok' : 'erro'}>{certo ? <Certo titulo="certo" /> : <Errado titulo="errado" />}</span>}
          {ver ? <span className={ehGrego(resposta) ? 'gr' : ''}>{resposta}</span>
            : <button className="link" onClick={() => setVer(true)}>ver resposta</button>}
        </div>
      )}
    </li>
  )
}

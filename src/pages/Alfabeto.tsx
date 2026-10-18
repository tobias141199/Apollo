// Lição 0: o alfabeto e a escrita. Baseada na Introdução do Athenaze (Part II: o alfabeto, p. xii;
// Part III: como escrever as letras, p. xvi–xix; Part IV: prática, p. xix–xx). Textos e desenhos nossos.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FonteTag } from '../components/FonteTag'
import { licaoAlfabeto, passosTrilha } from '../content'
import { GRUPOS, LETRAS, PALAVRAS_LEITURA, type Letra } from '../alfabeto/letras'
import { LetraAnimada } from '../alfabeto/LetraAnimada'
import { Pratica } from '../alfabeto/Pratica'
import { Avaliacao } from '../components/Avaliacao'
import { Certo, Lapis, Tocar } from '../components/Icones'
import { registrarEscrita, useProgresso } from '../lib/progresso'

export function Alfabeto() {
  const [sel, setSel] = useState(0)
  const [variante, setVariante] = useState(false)
  const [tocar, setTocar] = useState(0)
  const [devagar, setDevagar] = useState(false)
  const l = LETRAS[sel]
  const tracos = variante && l.tracosVariante ? l.tracosVariante : l.tracos
  const formas = [l.tracosMaiuscula, tracos]
  const { escrita } = useProgresso()
  const feitas = LETRAS.filter(x => escrita.has(x.nome)).length
  const proximaAEscrever = LETRAS.findIndex((x, i) => i > sel && !escrita.has(x.nome))
  const algumaFaltando = proximaAEscrever >= 0 ? proximaAEscrever : LETRAS.findIndex(x => !escrita.has(x.nome))
  const proxima = passosTrilha[passosTrilha.findIndex(p => p.licao.id === 'alfabeto') + 1]?.licao

  const escolher = (i: number, rolar = false) => {
    setSel((i + LETRAS.length) % LETRAS.length); setVariante(false); setTocar(t => t + 1)
    if (rolar) document.getElementById('oficina')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <article className="pagina alfabeto">
      <nav className="migalhas"><Link to="/trilha">Trilha</Link> › Etapa 0: Antes de começar</nav>
      <header className="cab-licao">
        <span className="marca-livro livro-athenaze">Lição 0</span>
        <h1>O alfabeto e a escrita <span className="gr titulo-grego">τὰ γράμματα</span></h1>
        <p className="sub">
          O grego tem 24 letras, e muitas você já conhece de vista (α, β, π, Ω…). Aqui você aprende o nome e o som de cada uma
          e, principalmente, <b>como escrevê-las à mão</b>, maiúscula e minúscula, traço por traço, na ordem e na direção certas.
        </p>
        <p className="sub"><b>Para concluir a lição, escreva as 24 letras</b> no quadro “Agora você” e depois faça a avaliação.</p>
        <FonteTag fonte={licaoAlfabeto.fonte!} />
      </header>

      {/* ---------- oficina: uma letra por vez ---------- */}
      <div className="escrita-progresso">
        <Lapis /> <b>{feitas} de {LETRAS.length}</b> letras escritas
        <div className="trilha-barra"><div style={{ width: `${100 * feitas / LETRAS.length}%` }} /></div>
        {feitas < LETRAS.length && algumaFaltando >= 0 && algumaFaltando !== sel &&
          <button className="link" onClick={() => escolher(algumaFaltando, true)}>ir para a próxima que falta ({LETRAS[algumaFaltando].maiuscula} {LETRAS[algumaFaltando].minuscula})</button>}
      </div>
      <section id="oficina" className="oficina">
        <div className="oficina-letra">
          <LetraAnimada formas={formas} tocar={tocar} velocidade={devagar ? .45 : 1} rotulo={`${l.nomePt}, maiúscula e minúscula`} />
          <div className="oficina-controles">
            <button className="icone-grande" onClick={() => escolher(sel - 1)} aria-label="Letra anterior">‹</button>
            <button className="botao" onClick={() => setTocar(t => t + 1)}><Tocar /> Ver de novo</button>
            <label className="check"><input type="checkbox" checked={devagar} onChange={e => setDevagar(e.target.checked)} /> devagar</label>
            <button className="icone-grande" onClick={() => escolher(sel + 1)} aria-label="Próxima letra">›</button>
          </div>
        </div>
        <div className="oficina-info">
          <div className="par-letras gr">{l.maiuscula} {l.minuscula}{l.variante && <> <span title="no fim da palavra">{l.variante}</span></>}</div>
          <div className="nome-letra"><span className="gr">{l.nome}</span> · {l.nomePt} · <span className="translit">{l.translit}</span></div>
          <p className="som">{l.som}</p>
          {l.variante && (
            <div className="segmentado">
              <button className={!variante ? 'ativa' : ''} onClick={() => { setVariante(false); setTocar(t => t + 1) }}>σ (no meio)</button>
              <button className={variante ? 'ativa' : ''} onClick={() => { setVariante(true); setTocar(t => t + 1) }}>ς (no fim)</button>
            </div>
          )}
          <p className="grupo-letra"><b>{GRUPOS[l.grupo].titulo}.</b> {GRUPOS[l.grupo].texto}</p>
          <p className="dica-tracos">Os números marcam onde cada traço começa; a setinha mostra para onde a caneta vai.</p>
          <h3>Agora você {escrita.has(l.nome) && <span className="ja-escrita"><Certo /> já escrita</span>}</h3>
          <p className="dica-tracos">Escreva a maiúscula e a minúscula por cima do modelo e clique em Conferir.</p>
          <Pratica key={`${sel}-${variante}`} formas={formas} nomes={['maiúscula', 'minúscula']} rotulo={`${l.nomePt}, maiúscula e minúscula`}
            aoPassar={() => registrarEscrita(l.nome)} />
          {escrita.has(l.nome) && feitas < LETRAS.length && algumaFaltando >= 0 && (
            <button className="botao" onClick={() => escolher(algumaFaltando)}>Próxima letra: {LETRAS[algumaFaltando].maiuscula} {LETRAS[algumaFaltando].minuscula} ›</button>
          )}
        </div>
      </section>

      <section>
        <h2>As 24 letras</h2>
        <p>Toque numa letra para vê-la sendo escrita e praticar.</p>
        <div className="grade-letras">
          {LETRAS.map((x, i) => (
            <button key={x.nome} className={`ficha-letra ${i === sel ? 'ativa' : ''} ${escrita.has(x.nome) ? 'escrita' : ''}`} onClick={() => escolher(i, true)}>
              {escrita.has(x.nome) && <span className="ficha-feita" title="já escrita"><Certo /></span>}
              <span className="gr ficha-par">{x.maiuscula} {x.minuscula}</span>
              <span className="ficha-nome">{x.nomePt}</span>
              <span className="ficha-translit">{x.translit}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Os quatro tamanhos</h2>
        <p>
          As maiúsculas se copiam como as letras impressas. Nas minúsculas, o que mais ajuda é saber <b>onde cada letra fica na pauta</b>.
          O Athenaze as divide em quatro grupos:
        </p>
        {([1, 2, 3, 4] as const).map(g => <Grupo key={g} g={g} aoEscolher={i => escolher(i, true)} />)}
      </section>

      <section className="sinais">
        <h2>Sinais e sons especiais</h2>
        <dl>
          <dt><span className="gr">ἁ ἀ</span> espíritos</dt>
          <dd>Toda palavra que começa por vogal leva um “espírito”. O <b>áspero</b> (aberto para a direita, como em <span className="gr">ἁ</span>) soa como um h aspirado: <span className="gr">ἡμέρα</span> = hēméra. O <b>brando</b> (aberto para a esquerda, como em <span className="gr">ἀ</span>) não soa: <span className="gr">ἀγρός</span> = agrós.</dd>
          <dt><span className="gr">ά ὰ ᾶ</span> acentos</dt>
          <dd>Marcam a sílaba de destaque. No grego antigo o acento era de <b>altura</b> (a voz subia), não de força. Por enquanto, leia a sílaba acentuada com mais ênfase.</dd>
          <dt><span className="gr">ει ου</span> ditongos</dt>
          <dd><span className="gr">ει</span> soa como o “ei” de “lei” (ou um ê longo); <span className="gr">ου</span> soa como “u” longo: <span className="gr">οὐ</span> = “u”.</dd>
          <dt><span className="gr">γγ γκ</span></dt>
          <dd>O primeiro γ soa como n: <span className="gr">ἄγγελος</span> = ánguelos (daí “anjo”).</dd>
          <dt><span className="gr">ᾳ ῃ ῳ</span> iota subscrito</dt>
          <dd>Um ι pequeno escrito embaixo da vogal. Era pronunciado no período clássico; hoje costumamos não pronunciá-lo, mas ele faz parte da grafia.</dd>
          <dt><span className="gr">· ;</span> pontuação</dt>
          <dd>O ponto alto (<span className="gr">·</span>) vale como dois-pontos ou ponto e vírgula; o <b>;</b> grego é o nosso ponto de interrogação.</dd>
        </dl>
      </section>

      <section>
        <h2>Treino rápido</h2>
        <p>Para treinar à vontade, sem nota. A avaliação da lição está logo abaixo.</p>
        <div className="testes-alfabeto">
          <TesteLetra />
          <TestePalavra />
        </div>
      </section>

      <section id="avaliacao">
        <Avaliacao l={licaoAlfabeto} exigencia={feitas < LETRAS.length ? <>
          Primeiro escreva todas as letras: faltam <b>{LETRAS.length - feitas}</b>.{' '}
          {algumaFaltando >= 0 && <button className="link" onClick={() => escolher(algumaFaltando, true)}>Escrever {LETRAS[algumaFaltando].maiuscula} {LETRAS[algumaFaltando].minuscula}</button>}
        </> : undefined} />
      </section>
      <footer className="fim-licao">
        {proxima && <Link className="botao secundario" to={proxima.rota}>Próxima: {proxima.rotulo} ›</Link>}
      </footer>
    </article>
  )
}

function Grupo({ g, aoEscolher }: { g: Letra['grupo']; aoEscolher: (i: number) => void }) {
  const [tocar, setTocar] = useState(0)
  const letras = LETRAS.map((l, i) => ({ l, i })).filter(({ l }) => l.grupo === g)
  return (
    <div className="grupo-tamanho">
      <h3>{g}. {GRUPOS[g].titulo}</h3>
      <p>{GRUPOS[g].texto}</p>
      <div className="fila-letras" onMouseEnter={() => setTocar(t => t + 1)}>
        {letras.map(({ l, i }) => (
          <button key={l.nome} className="mini-letra" onClick={() => aoEscolher(i)} title={`${l.nomePt}: ver e praticar`}>
            <LetraAnimada formas={[l.tracos]} tocar={tocar} compacta rotulo={l.nomePt} />
            <span className="gr">{l.minuscula}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Sorteia uma pergunta com 4 opções (a certa + 3 erradas). */
function useSorteio<T>(itens: T[], chave: (x: T) => string) {
  const [n, setN] = useState(0)
  return useMemo(() => {
    const embaralhar = <U,>(a: U[]) => a.map(x => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map(p => p[1])
    const [certo, ...resto] = embaralhar(itens)
    const opcoes = embaralhar([certo, ...resto.filter(x => chave(x) !== chave(certo)).slice(0, 3)])
    // Sorteado uma vez por pergunta (n muda ao pedir a próxima).
    return { certo, opcoes, maiuscula: Math.random() < .5, proxima: () => setN(n + 1) }
  }, [n])
}

function Teste<T>({ titulo, sorteio, pergunta, rotulo, chave }: {
  titulo: string; sorteio: ReturnType<typeof useSorteio<T>>; pergunta: (x: T) => React.ReactNode; rotulo: (x: T) => string; chave: (x: T) => string
}) {
  const [escolha, setEscolha] = useState<string | null>(null)
  const [placar, setPlacar] = useState({ certas: 0, total: 0 })
  const { certo, opcoes, proxima } = sorteio
  const responder = (x: T) => {
    if (escolha) return
    setEscolha(chave(x))
    setPlacar(p => ({ certas: p.certas + (chave(x) === chave(certo) ? 1 : 0), total: p.total + 1 }))
  }
  return (
    <div className="teste-alfabeto">
      <h3>{titulo}</h3>
      <div className="teste-pergunta">{pergunta(certo)}</div>
      <div className="teste-opcoes">
        {opcoes.map(x => (
          <button key={chave(x)} onClick={() => responder(x)}
            className={escolha ? chave(x) === chave(certo) ? 'certa' : chave(x) === escolha ? 'errada' : '' : ''}>
            {rotulo(x)}
          </button>
        ))}
      </div>
      <div className="teste-rodape">
        <span>{placar.certas} de {placar.total}</span>
        {escolha && <button className="botao" onClick={() => { setEscolha(null); proxima() }}>Próxima ›</button>}
      </div>
    </div>
  )
}

function TesteLetra() {
  const sorteio = useSorteio(LETRAS, l => l.nome)
  return <Teste titulo="Que letra é esta?" sorteio={sorteio} chave={l => l.nome} rotulo={l => l.nomePt}
    pergunta={l => <span className="gr pergunta-letra">{sorteio.maiuscula ? l.maiuscula : l.minuscula}</span>} />
}

function TestePalavra() {
  const sorteio = useSorteio(PALAVRAS_LEITURA, p => p.pt)
  return <Teste titulo="Leia: que palavra portuguesa vem daqui?" sorteio={sorteio} chave={p => p.pt} rotulo={p => p.pt}
    pergunta={p => <span className="gr pergunta-palavra">{p.grego}</span>} />
}

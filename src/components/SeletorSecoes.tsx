import { licoes, passosTrilha, trilha, type LivroLicao } from '../content'
import { useSelecao } from '../lib/selecao'

const disponiveis = licoes.filter(l => !l.emPreparacao)

/** Escolha de lições (JACT e Athenaze) agrupadas pelas etapas da trilha, com atalhos "até a etapa N". */
export function SeletorSecoes() {
  const { selecionadas, alternar, definir, apenasAprender, setApenasAprender, vocab } = useSelecao()
  const ateEtapa = (n: number) => passosTrilha.filter(p => p.etapa <= n && !p.licao.emPreparacao).map(p => p.licao.id)
  // "só JACT"/"só Athenaze" filtra a escolha atual; "ambos" completa as etapas já escolhidas com os dois livros.
  const soLivro = (livro: LivroLicao | null) => {
    const etapas = new Set(passosTrilha.filter(p => selecionadas.has(p.licao.id)).map(p => p.etapa))
    const base = passosTrilha.filter(p => !p.licao.emPreparacao && (etapas.size === 0 || etapas.has(p.etapa)))
    definir(base.filter(p => livro ? p.licao.livro === livro && (selecionadas.size === 0 || selecionadas.has(p.licao.id)) : true)
      .map(p => p.licao.id))
  }
  return (
    <details className="seletor">
      <summary>
        Estudando: <b>{resumo(selecionadas)}</b> · {vocab.length} palavras
      </summary>
      <div className="seletor-corpo">
        <div className="atalhos">
          Até a etapa:{' '}
          {trilha.etapas.map((_, n) => (
            <button key={n} className="pilula" onClick={() => definir(ateEtapa(n))}>{n + 1}</button>
          ))}
          <button className="pilula" onClick={() => definir(disponiveis.map(l => l.id))}>tudo</button>
          <button className="pilula" onClick={() => definir([])}>nada</button>
        </div>
        <div className="atalhos">
          Livros:{' '}
          <button className="pilula" onClick={() => soLivro(null)} title="Seleciona as lições dos dois livros">ambos</button>
          <button className="pilula livro-jact" onClick={() => soLivro('JACT')} title="Mantém só as seções da JACT já escolhidas">só JACT</button>
          <button className="pilula livro-athenaze" onClick={() => soLivro('Athenaze')} title="Mantém só os capítulos do Athenaze já escolhidos">só Athenaze</button>
        </div>
        <label className="check">
          <input type="checkbox" checked={apenasAprender} onChange={e => setApenasAprender(e.target.checked)} />
          Só o vocabulário “a aprender” de cada livro
        </label>
        {trilha.etapas.map((e, n) => (
          <div key={n} className="seletor-linha">
            <span className="seletor-nome">{n + 1}. {e.titulo}</span>
            {passosTrilha.filter(p => p.etapa === n).map(({ licao: l }) => (
              <button
                key={l.id} disabled={l.emPreparacao} title={l.emPreparacao ? 'em preparação' : l.titulo}
                className={`pilula livro-${l.livro.toLowerCase()} ${selecionadas.has(l.id) ? 'ativa' : ''}`}
                onClick={() => alternar(l.id)}
              >{l.rotulo}</button>
            ))}
          </div>
        ))}
      </div>
    </details>
  )
}

function resumo(sel: Set<string>) {
  if (sel.size === 0) return 'nada'
  const escolhidas = disponiveis.filter(l => sel.has(l.id))
  if (escolhidas.length === disponiveis.length) return 'tudo'
  const n = (livro: LivroLicao) => escolhidas.filter(l => l.livro === livro).length
  if (escolhidas.length <= 6) return escolhidas.map(l => l.rotulo).join(', ')
  return `${n('JACT')} seções da JACT + ${n('Athenaze')} capítulos do Athenaze`
}

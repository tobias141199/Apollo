// O flashcard, no espírito da cerâmica ática: no claro, "figuras negras" (grego em verniz preto
// sobre argila); no escuro, "figuras vermelhas" (grego em terracota sobre preto). A frente traz o
// lema (ou, na direção português → grego, a imagem e a glosa); o verso é uma etiqueta de museu.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { imagemDe, licaoPorId, type Entrada, type ImagemPalavra } from '../content'
import type { Direcao } from '../lib/db'
import { EditorImagem, useImagem } from './EditorImagem'

interface Props {
  e: Entrada
  direcao: Direcao
  virado: boolean
  onVirar: () => void
}

export function Tabuleta({ e, direcao, virado, onVirar }: Props) {
  const img = useImagem(e.chave)
  const licao = licaoPorId.get(e.licaoId)!
  const parar = (ev: React.SyntheticEvent) => ev.stopPropagation()
  const rotulo = <div className="cartao-rotulo"><span>{e.classe}</span><span>{licao.rotulo}</span></div>

  return (
    <div className="cartao-cena">
      <div className={`cartao ${virado ? 'virado' : ''}`} onClick={() => !virado && onVirar()}
        role="button" aria-label={virado ? undefined : 'virar o cartão'} tabIndex={virado ? -1 : 0}>
        <div className="face frente" inert={virado} aria-hidden={virado}>
          {direcao === 'gp' ? (
            <>
              {rotulo}
              <div className="frente-lema"><span className="gr lema-cartao">{e.grego}</span></div>
              <Friso />
              <div className="cartao-dica"><Dica /></div>
            </>
          ) : (
            <>
              <Quadro img={img} />
              <Friso />
              <div className="frente-glosa">
                <div className="glosa-cartao">{e.glosa}</div>
                <div className="cartao-dica">{e.classe} · <Dica /></div>
              </div>
            </>
          )}
        </div>

        <div className="face verso" inert={!virado} aria-hidden={!virado}>
          <Quadro img={img} />
          <Friso />
          <div className="etiqueta">
            <div className="gr lema-verso">{e.lexical && e.lexical !== e.grego ? e.lexical : e.grego}</div>
            <div className="glosa-cartao">{e.glosa}</div>
            <div className="etiqueta-meta" onClick={parar}>
              {e.classe} · <Link to={licao.rota}>{licao.rotulo}</Link> · <Link to={`/palavra/${encodeURIComponent(e.chave)}`}>verbete</Link>
            </div>
            <Credito img={img} />
            <div onClick={parar}><EditorImagem chave={e.chave} lema={e.grego} img={img} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Dica = () => <><span className="so-teclado">espaço para virar</span><span className="so-toque">toque para virar</span></>

/** Faixa de meandro, como as que dividem as cenas num vaso. */
export function Friso() {
  return <div className="friso" aria-hidden />
}

/** A imagem da palavra. Sem imagem (ou se ela falhar), um campo liso com um meandro discreto. */
export function Quadro({ img }: { img?: ImagemPalavra }) {
  const [falhou, setFalhou] = useState<string | null>(null)
  const ok = img && falhou !== img.src
  return (
    <div className="quadro">
      {ok
        ? <img src={img.src} alt={img.titulo} decoding="async"
            style={img.foco ? { objectPosition: img.foco } : undefined} onError={() => setFalhou(img.src)} />
        : <div className="quadro-vazio" aria-hidden />}
    </div>
  )
}

/** Legenda de museu: obra, data, autor, acervo e licença (a "fonte" da imagem). */
export function Credito({ img }: { img?: ImagemPalavra }) {
  if (!img) return null
  const meta = [img.data, img.autor, img.acervo, img.licenca].filter(Boolean).join(' · ')
  return (
    <p className="credito">
      {img.url
        ? <a href={img.url} target="_blank" rel="noreferrer" onClick={ev => ev.stopPropagation()}>{img.titulo}</a>
        : <span>{img.titulo}</span>}
      {meta && <> — {meta}</>}
    </p>
  )
}

/** Pré-carrega a imagem de uma palavra (o próximo cartão da fila). */
export function preCarregar(chavePalavra: string | undefined) {
  const img = chavePalavra && imagemDe(chavePalavra)
  if (img) new Image().src = img.src
}

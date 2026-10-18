// O flashcard como uma tabuleta de mármore: a frente traz o grego "entalhado" (ou, na direção
// português → grego, a imagem e a glosa); o verso é um afresco com a imagem, a glosa e o grego.
// A virada é 3D (CSS); com `prefers-reduced-motion`, vira um simples esmaecer.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { imagemDe, licaoPorId, type Entrada, type ImagemPalavra } from '../content'
import type { Direcao } from '../lib/db'

interface Props {
  e: Entrada
  direcao: Direcao
  virado: boolean
  onVirar: () => void
}

export function Tabuleta({ e, direcao, virado, onVirar }: Props) {
  const img = imagemDe(e.chave)
  const licao = licaoPorId.get(e.licaoId)!
  const parar = (ev: React.MouseEvent) => ev.stopPropagation()

  return (
    <div className="tabuleta-cena">
      <div className={`tabuleta ${virado ? 'virada' : ''}`} onClick={() => !virado && onVirar()}
        role="button" aria-label={virado ? undefined : 'virar o cartão'} tabIndex={virado ? -1 : 0}>
        <div className={`face frente ${direcao === 'gp' ? 'marmore' : 'afresco'}`} inert={virado} aria-hidden={virado}>
          {direcao === 'gp' ? (
            <div className="frente-gp">
              <span className="classe-entalhe">{e.classe}</span>
              <div className="gr entalhe">{e.grego}</div>
              <span className="dica-virar">toque ou aperte espaço</span>
            </div>
          ) : (
            <>
              <Quadro img={img} />
              <div className="legenda-face">
                <div className="glosa-pintada">{e.glosa}</div>
                <span className="classe-entalhe">{e.classe}</span>
              </div>
            </>
          )}
        </div>

        <div className="face verso afresco" inert={!virado} aria-hidden={!virado}>
          <Quadro img={img} credito />
          <div className="legenda-face">
            <div className="glosa-pintada">{e.glosa}</div>
            <div className="gr entalhe pequeno">{e.grego}</div>
            {e.lexical && e.lexical !== e.grego && <div className="gr lexical-face">{e.lexical}</div>}
            <div className="ligacoes">
              {e.classe} · <Link to={licao.rota} onClick={parar}>{licao.rotulo}</Link>
              {' · '}<Link to={`/palavra/${encodeURIComponent(e.chave)}`} onClick={parar}>verbete</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** A imagem emoldurada como afresco, com o crédito (a "fonte" da imagem). Sem imagem: um meandro. */
export function Quadro({ img, credito = false }: { img?: ImagemPalavra; credito?: boolean }) {
  const [falhou, setFalhou] = useState<string | null>(null)
  const ok = img && falhou !== img.src
  return (
    <figure className="quadro">
      <div className="quadro-moldura" style={ok ? { '--fundo': `url("${img.src}")` } as React.CSSProperties : undefined}>
        {ok
          ? <img src={img.src} alt={img.titulo} loading="eager" decoding="async"
              style={img.foco ? { objectPosition: img.foco } : undefined} onError={() => setFalhou(img.src)} />
          : <div className="quadro-vazio" aria-hidden />}
      </div>
      {credito && img && (
        <figcaption className="credito">
          <a href={img.url} target="_blank" rel="noreferrer" onClick={ev => ev.stopPropagation()}>{img.titulo}</a>
          {[img.data, img.autor, img.acervo, img.licenca].filter(Boolean).map(x => ` · ${x}`).join('')}
          {img.descricao && <span className="credito-nota">{img.descricao}</span>}
        </figcaption>
      )}
    </figure>
  )
}

/** Pré-carrega a imagem de uma palavra (o próximo cartão da fila). */
export function preCarregar(chavePalavra: string | undefined) {
  const img = chavePalavra && imagemDe(chavePalavra)
  if (img) new Image().src = img.src
}

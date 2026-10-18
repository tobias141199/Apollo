// Editor de imagens dos flashcards. Só aparece para o administrador (ADMIN_EMAIL no servidor):
// envia a imagem para /api/imagens, que a converte para WebP e a guarda no banco de dados.
// Os outros usuários só veem as imagens.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { imagemDe, type ImagemPalavra } from '../content'
import { useConta } from '../lib/nuvem'

// Trocas feitas nesta sessão (o JSON só é relido ao recarregar a página). null = removida.
const trocas = new Map<string, ImagemPalavra | null>()
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach(f => f())
const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f) } }

/** A imagem atual de uma palavra, já com as trocas feitas no editor. */
export function useImagem(chave: string): ImagemPalavra | undefined {
  const versao = useSyncExternalStore(assinar, () => trocas.get(chave))
  return trocas.has(chave) ? versao ?? undefined : imagemDe(chave)
}

const LICENCAS = ['não informada', 'Domínio público', 'CC0', 'CC BY 4.0', 'CC BY-SA 4.0', 'CC BY 3.0', 'CC BY-SA 3.0', 'CC BY 2.0', 'CC BY-SA 2.0']

const lerArquivo = (f: Blob) => new Promise<string>((ok, erro) => {
  const r = new FileReader()
  r.onload = () => ok(String(r.result).split(',')[1])
  r.onerror = erro
  r.readAsDataURL(f)
})

export function EditorImagem({ chave, lema, img }: { chave: string; lema: string; img?: ImagemPalavra }) {
  const [aberto, setAberto] = useState(false)
  if (!useConta().usuario?.admin) return null
  return aberto
    ? <Painel chave={chave} lema={lema} img={img} fechar={() => setAberto(false)} />
    : (
      <div className="editor-acoes">
        <button className="link" onClick={() => setAberto(true)}>{img ? 'trocar imagem' : 'pôr imagem'}</button>
        {img && <button className="link" onClick={() => remover(chave)}>remover</button>}
      </div>
    )
}

async function remover(chave: string) {
  if (!confirm('Remover a imagem desta palavra?')) return
  const r = await fetch(`/api/imagens?chave=${encodeURIComponent(chave)}`, { method: 'DELETE' })
  if (!r.ok) return alert(await r.text())
  trocas.set(chave, null); avisar()
}

function Painel({ chave, lema, img, fechar }: { chave: string; lema: string; img?: ImagemPalavra; fechar: () => void }) {
  const [arquivo, setArquivo] = useState<Blob | null>(null)
  const [link, setLink] = useState('')
  const [previa, setPrevia] = useState<string | null>(null)
  const [campos, setCampos] = useState({ titulo: '', autor: '', data: '', acervo: '', url: '', licenca: 'não informada' })
  const [estado, setEstado] = useState<'' | 'enviando' | string>('')
  const [arrastando, setArrastando] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)

  const escolher = (f: Blob | null | undefined) => {
    if (!f || !f.type.startsWith('image/')) return
    setArquivo(f); setLink(''); setPrevia(URL.createObjectURL(f))
  }
  // Colar (Ctrl+V / ⌘V) uma imagem copiada de outro site ou um print.
  useEffect(() => {
    const colar = (ev: ClipboardEvent) => {
      const item = [...(ev.clipboardData?.items ?? [])].find(i => i.type.startsWith('image/'))
      if (item) { ev.preventDefault(); escolher(item.getAsFile()) }
    }
    window.addEventListener('paste', colar)
    return () => window.removeEventListener('paste', colar)
  }, [])
  useEffect(() => () => { if (previa) URL.revokeObjectURL(previa) }, [previa])

  const salvar = async () => {
    if (!arquivo && !link) return setEstado('Escolha, arraste ou cole uma imagem (ou cole o endereço dela).')
    setEstado('enviando')
    const corpo = { chave, lema, ...campos, titulo: campos.titulo || lema, link: link || undefined, dados: arquivo ? await lerArquivo(arquivo) : undefined }
    const r = await fetch('/api/imagens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
    if (!r.ok) return setEstado(await r.text())
    const nova = await r.json() as Omit<ImagemPalavra, 'src'>
    trocas.set(chave, { ...nova, src: `/api/imagens/${nova.id}.webp` }); avisar(); fechar()
  }
  const campo = (k: keyof typeof campos, rotulo: string, dica = '') => (
    <label>{rotulo}<input value={campos[k]} placeholder={dica} onChange={ev => setCampos(c => ({ ...c, [k]: ev.target.value }))} /></label>
  )

  return (
    <div className="editor-painel">
      <div className={`editor-alvo ${arrastando ? 'arrastando' : ''}`}
        onClick={() => entrada.current?.click()}
        onDragOver={ev => { ev.preventDefault(); setArrastando(true) }}
        onDragLeave={() => setArrastando(false)}
        onDrop={ev => { ev.preventDefault(); setArrastando(false); escolher(ev.dataTransfer.files[0]) }}>
        {previa || link
          ? <img src={previa ?? link} alt="" />
          : <span>Arraste uma imagem aqui, cole com <kbd>Ctrl</kbd>+<kbd>V</kbd> ou clique para escolher</span>}
        <input ref={entrada} type="file" accept="image/*" hidden onChange={ev => escolher(ev.target.files?.[0])} />
      </div>
      <label>…ou o endereço da imagem<input value={link} placeholder="https://…/imagem.jpg"
        onChange={ev => { setLink(ev.target.value.trim()); setArquivo(null); setPrevia(null) }} /></label>
      <details>
        <summary>Crédito (opcional)</summary>
        <div className="editor-campos">
          {campo('titulo', 'Título', img?.titulo ?? 'ex.: Ânfora ática de figuras negras')}
          {campo('data', 'Data', 'ex.: c. 530 a.C.')}
          {campo('autor', 'Autor / fotógrafo')}
          {campo('acervo', 'Museu / acervo')}
          {campo('url', 'Página de origem', 'https://…')}
          <label>Licença<select value={campos.licenca} onChange={ev => setCampos(c => ({ ...c, licenca: ev.target.value }))}>
            {LICENCAS.map(l => <option key={l}>{l}</option>)}</select></label>
        </div>
      </details>
      <div className="editor-botoes">
        <button className="botao" onClick={salvar} disabled={estado === 'enviando'}>{estado === 'enviando' ? 'Salvando…' : 'Salvar'}</button>
        <button className="botao secundario" onClick={fechar}>Cancelar</button>
      </div>
      {estado && estado !== 'enviando' && <p className="editor-erro">{estado}</p>}
    </div>
  )
}

import { forwardRef, useState } from 'react'
import { betaParaGrego } from '../lib/greek'

const DIACS = [
  [')', 'ἀ', 'espírito brando'], ['(', 'ἁ', 'espírito áspero'], ['/', 'ά', 'agudo'],
  ['\\', 'ὰ', 'grave'], ['=', 'ᾶ', 'circunflexo'], ['|', 'ᾳ', 'iota subscrito'],
] as const
const LETRAS = 'αβγδεζηθικλμνξοπρστυφχψω'.split('')

/** Converte (σ final → σ, depois beta → grego) mantendo o que já é grego. */
const converter = (s: string) => betaParaGrego(s.replace(/ς/g, 'σ'))

interface Props {
  value: string
  onChange: (v: string) => void
  onEnter?: () => void
  placeholder?: string
  autoFocus?: boolean
}

/**
 * Campo para digitar grego. Com "beta code" ligado, o teclado latino vira grego:
 * lo/gos → λόγος · a)/nqrwpos → ἄνθρωπος · th=| → τῇ  (q=θ, c=ξ, y=ψ, w=ω, h=η, x=χ, f=φ).
 */
export const GregoInput = forwardRef<HTMLInputElement, Props>(function GregoInput(
  { value, onChange, onEnter, placeholder, autoFocus }, ref) {
  const [beta, setBeta] = useState(true)
  const [teclado, setTeclado] = useState(false)
  const set = (v: string) => onChange(beta ? converter(v) : v.normalize('NFC'))
  return (
    <div className="grego-input">
      <input
        ref={ref}
        className="gr"
        lang="grc"
        value={value}
        autoFocus={autoFocus}
        autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false}
        placeholder={placeholder ?? (beta ? 'digite em beta code: lo/gos' : 'grego')}
        onChange={e => set(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onEnter?.() }}
      />
      <div className="grego-opcoes">
        <label className="check" title="q=θ c=ξ y=ψ w=ω h=η x=χ f=φ · ) brando ( áspero / agudo \ grave = circunflexo | iota subscrito">
          <input type="checkbox" checked={beta} onChange={e => setBeta(e.target.checked)} /> beta code
        </label>
        <button type="button" className="link" onClick={() => setTeclado(t => !t)}>{teclado ? 'fechar teclado' : 'teclado grego'}</button>
      </div>
      {teclado && (
        <div className="teclado" role="group" aria-label="Teclado grego">
          {LETRAS.map(l => <button type="button" key={l} className="tecla gr" onClick={() => onChange((value + l).normalize('NFC'))}>{l}</button>)}
          {DIACS.map(([b, ex, nome]) => (
            <button type="button" key={b} className="tecla gr" title={nome} onClick={() => onChange(converter(value + b))}>{ex}</button>
          ))}
          <button type="button" className="tecla" title="apagar" onClick={() => onChange([...value.normalize('NFD')].slice(0, -1).join('').normalize('NFC'))}>⌫</button>
        </div>
      )}
    </div>
  )
})

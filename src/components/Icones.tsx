// Ícones de traço fino, desenhados em SVG (sem emojis: emojis mudam de aparelho para aparelho e
// destoam do visual). Herdam a cor do texto (`currentColor`) e o tamanho da fonte (1em).
type P = { titulo?: string; className?: string }

function Icone({ titulo, className, children }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" className={`icone-svg ${className ?? ''}`}
      role={titulo ? 'img' : undefined} aria-label={titulo} aria-hidden={titulo ? undefined : true}>
      {children}
    </svg>
  )
}

export const Certo = (p: P) => <Icone {...p}><path d="M4.5 12.5l5 5L19.5 7" /></Icone>
export const Errado = (p: P) => <Icone {...p}><path d="M6 6l12 12M18 6L6 18" /></Icone>
export const Cadeado = (p: P) => <Icone {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Icone>
export const Tocar = (p: P) => <Icone {...p}><path d="M8 5.5v13l10-6.5z" fill="currentColor" /></Icone>
export const Engrenagem = (p: P) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
    <circle cx="12" cy="12" r="6.6" />
  </Icone>
)
export const Lapis = (p: P) => <Icone {...p}><path d="M4 20l1-4L16 5l3 3L8 19z" /><path d="M14 7l3 3" /></Icone>

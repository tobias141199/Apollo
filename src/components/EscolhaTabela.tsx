import { paradigmas } from '../content'

const GRUPOS = [['artigo', 'Artigo'], ['substantivo', 'Substantivos'], ['adjetivo', 'Adjetivos'], ['pronome', 'Pronomes'], ['verbo', 'Verbos']] as const

/** Menu compacto "+ tabela", agrupado como na página Tabelas. */
export function EscolhaTabela({ excluir, onEscolher }: { excluir: string[]; onEscolher: (id: string) => void }) {
  return (
    <select className="escolha-tabela" value="" aria-label="Acrescentar tabela" onChange={e => e.target.value && onEscolher(e.target.value)}>
      <option value="">＋ tabela</option>
      {GRUPOS.map(([g, rot]) => (
        <optgroup key={g} label={rot}>
          {paradigmas.filter(p => p.grupo === g && !excluir.includes(p.id)).map(p => (
            <option key={p.id} value={p.id}>{p.titulo}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

// Lições que o aluno marcou como estudadas na trilha (localStorage).
import { useEffect, useState } from 'react'
import { gravar, ler } from './selecao'

const CHAVE = 'ag:estudadas'

export function useEstudadas() {
  const [ids, setIds] = useState<string[]>(() => ler(CHAVE, []))
  useEffect(() => gravar(CHAVE, ids), [ids])
  const alternar = (id: string) => setIds(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id])
  return { estudadas: new Set(ids), alternar }
}

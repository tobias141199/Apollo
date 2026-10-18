// Lições estudadas = lições aprovadas na avaliação (ver progresso.ts). Mantido para quem só precisa do conjunto.
import { useProgresso } from './progresso'

export function useEstudadas() {
  return { estudadas: useProgresso().aprovadas }
}

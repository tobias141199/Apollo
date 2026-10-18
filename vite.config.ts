import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `vite build --mode public` gera o site público SEM o pacote privado (content/private).
// O servidor (server/index.ts) entrega esse site e a API; no Railway é só ele que roda.
export default defineConfig(({ mode }) => ({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    {
      name: 'excluir-conteudo-privado',
      enforce: 'pre',
      load(id) {
        if (mode === 'public' && id.includes('/content/private/')) return id.endsWith('.json') ? 'null' : 'export default null'
      },
    },
  ],
  // No `npm run dev`, a API (login, progresso, imagens) é o servidor local de server/index.ts.
  server: { proxy: { '/api': 'http://localhost:3000' } },
}))

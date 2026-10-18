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
  // Duas páginas: o site (index.html) e a de login (entrar.html), que não leva nada do conteúdo.
  // O manifesto diz ao servidor quais arquivos a página de login usa (os únicos liberados sem login).
  build: {
    manifest: true,
    rollupOptions: { input: { site: 'index.html', entrar: 'entrar.html' } },
  },
  // No `npm run dev`, a API (login, progresso, imagens) é o servidor local de server/index.ts.
  server: { proxy: { '/api': 'http://localhost:3000' } },
}))

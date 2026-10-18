import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `vite build --mode public` gera o site público SEM o pacote privado (content/private).
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
}))

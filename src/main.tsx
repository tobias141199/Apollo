import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'
import { iniciar } from './lib/nuvem'

// Antes de desenhar: vê quem está logado, carrega as imagens do servidor e baixa o progresso da conta.
iniciar().finally(() => createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>))

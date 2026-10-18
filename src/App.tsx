import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { temPrivado } from './content'
import { CamadaJanelas } from './components/JanelaFlutuante'
import { Ajustes } from './pages/Ajustes'
import { Flashcards } from './pages/Flashcards'
import { Inicio } from './pages/Inicio'
import { JanelaTabelas } from './pages/JanelaTabelas'
import { LicaoPagina } from './pages/LicaoPagina'
import { Quiz } from './pages/Quiz'
import { Secoes } from './pages/Secoes'
import { Tabelas } from './pages/Tabelas'
import { Trilha } from './pages/Trilha'
import { Verbete } from './pages/Verbete'
import { Vocabulario } from './pages/Vocabulario'
import { JanelasProvider, useJanelas } from './lib/janelas'
import { SelecaoProvider } from './lib/selecao'
import { useConta } from './lib/nuvem'

const LINKS = [
  ['/trilha', 'Trilha'], ['/secoes', 'Índice'], ['/vocabulario', 'Vocabulário'], ['/flashcards', 'Flashcards'],
  ['/quiz', 'Quiz'], ['/tabelas', 'Tabelas'],
] as const

export function App() {
  return (
    <HashRouter>
      <SelecaoProvider>
        <JanelasProvider>
          <Casca />
        </JanelasProvider>
      </SelecaoProvider>
    </HashRouter>
  )
}

/** O nome de quem está logado (leva aos Ajustes, onde fica o "Sair"). */
function LinkConta() {
  const { usuario } = useConta()
  if (!usuario) return null
  return <NavLink to="/ajustes" className="conta" title={usuario.email}>{(usuario.nome ?? usuario.email).split(/[ @]/)[0]}</NavLink>
}

function Casca() {
  // A janela própria do navegador (/janela) mostra só as tabelas, sem menu nem rodapé.
  if (useLocation().pathname === '/janela') return <JanelaTabelas />
  return (
    <>
      <header className="topo">
        <div className="topo-in">
          <NavLink to="/" className="marca">Aprendendo <span className="gr">Ἑλληνικά</span></NavLink>
          <nav>
            {LINKS.map(([to, rot]) => <NavLink key={to} to={to}>{rot}</NavLink>)}
            <IndicadorJanelas />
            <NavLink to="/ajustes" title="Ajustes e backup" aria-label="Ajustes">⚙</NavLink>
            <LinkConta />
          </nav>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/trilha" element={<Trilha />} />
          <Route path="/secoes" element={<Secoes />} />
          <Route path="/secao/:id" element={<LicaoPagina />} />
          <Route path="/capitulo/:n" element={<LicaoPagina />} />
          <Route path="/vocabulario" element={<Vocabulario />} />
          <Route path="/palavra/:chave" element={<Verbete />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/tabelas" element={<Tabelas />} />
          <Route path="/ajustes" element={<Ajustes />} />
        </Routes>
      </main>
      <footer className="rodape">
        Baseado em <i>Aprendendo Grego</i> (JACT; ed. bras. Odysseus) e <i>Athenaze</i> (Balme &amp; Lawall).
        Projeto independente de estudo, sem vínculo com os editores.
        {temPrivado ? ' · pacote privado carregado' : ' · versão pública'}
      </footer>
      <CamadaJanelas />
    </>
  )
}

/** Botão no menu: mostra quantas janelas de tabelas estão abertas e esconde/mostra todas. */
function IndicadorJanelas() {
  const { janelas, minimizarTodas } = useJanelas()
  if (!janelas.length) return null
  const todasMin = janelas.every(j => j.minimizada)
  return (
    <button className="indicador-janelas" onClick={() => minimizarTodas(!todasMin)}
      title={todasMin ? 'Mostrar as janelas de tabelas' : 'Minimizar as janelas de tabelas'}>
      ▣ {janelas.length}
    </button>
  )
}

// Entrar ou criar conta (e-mail e senha, ou Google). Com a conta, o progresso fica salvo no servidor.
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { antesDoGoogle, entrar, useConta } from '../lib/nuvem'

export function Entrar() {
  const { servidor, google, usuario } = useConta()
  const [modo, setModo] = useState<'entrar' | 'cadastro'>('entrar')
  const [dados, setDados] = useState({ email: '', senha: '', nome: '' })
  const [erro, setErro] = useState(useSearchParams()[0].get('erro') === 'google' ? 'Não foi possível entrar com o Google. Tente de novo.' : '')
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <div className="pagina entrar"><h1>Você já entrou</h1><p>Conta: <b>{usuario.email}</b>. Para sair, vá a Ajustes (⚙).</p></div>
  if (!servidor) return <div className="pagina entrar"><h1>Entrar</h1><p className="vazio">O servidor não está disponível agora. O progresso continua salvo neste navegador.</p></div>

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setErro(''); setEnviando(true)
    try { await entrar(modo, dados) } catch (e) { setErro((e as Error).message); setEnviando(false) }
  }
  const campo = (k: keyof typeof dados) => ({ value: dados[k], onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setDados(d => ({ ...d, [k]: ev.target.value })) })

  return (
    <div className="pagina entrar">
      <h1>{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</h1>
      <p className="sub">Com uma conta, o seu progresso (flashcards, exercícios, lições estudadas) fica salvo e aparece em qualquer aparelho.</p>
      {google && (
        <>
          <a className="botao-google" href="/api/auth/google" onClick={() => { antesDoGoogle() }}>
            <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>
            Entrar com Google
          </a>
          <div className="ou"><span>ou</span></div>
        </>
      )}
      <form onSubmit={enviar} className="form-entrar">
        {modo === 'cadastro' && <label>Nome (opcional)<input {...campo('nome')} autoComplete="name" /></label>}
        <label>E-mail<input {...campo('email')} type="email" required autoComplete="email" /></label>
        <label>Senha<input {...campo('senha')} type="password" required minLength={modo === 'cadastro' ? 8 : undefined}
          autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} /></label>
        {modo === 'cadastro' && <small>Pelo menos 8 caracteres.</small>}
        {erro && <p className="editor-erro">{erro}</p>}
        <button className="botao" disabled={enviando}>{enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
      </form>
      <p className="trocar-modo">
        {modo === 'entrar'
          ? <>Ainda não tem conta? <button className="link" onClick={() => { setModo('cadastro'); setErro('') }}>Criar conta</button></>
          : <>Já tem conta? <button className="link" onClick={() => { setModo('entrar'); setErro('') }}>Entrar</button></>}
      </p>
    </div>
  )
}

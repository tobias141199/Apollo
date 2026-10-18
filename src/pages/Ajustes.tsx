import { useState } from 'react'
import { temPrivado } from '../content'
import { db, exportar, importar } from '../lib/db'
import { apagarProgressoNaConta, marcarTudo, sair, useConta } from '../lib/nuvem'
import { Link } from 'react-router-dom'

export function Ajustes() {
  const [msg, setMsg] = useState('')
  const { usuario, servidor } = useConta()
  const baixar = async () => {
    const blob = new Blob([await exportar()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `aprendendo-grego-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const carregar = async (f?: File) => {
    if (!f) return
    try { await importar(await f.text()); await marcarTudo(); setMsg('Backup restaurado.') } catch (e) { setMsg(`Erro: ${(e as Error).message}`) }
  }
  const zerar = async () => {
    if (!confirm('Apagar todo o progresso dos flashcards e respostas de exercícios? Isso não pode ser desfeito.')) return
    try { await apagarProgressoNaConta() } catch (e) { return setMsg(`Erro: ${(e as Error).message}`) }
    await Promise.all([db.cartoes.clear(), db.respostas.clear()])
    setMsg('Progresso apagado.')
  }
  return (
    <div className="pagina">
      <h1>Ajustes</h1>
      {servidor && (
        <section>
          <h2>Conta</h2>
          {usuario
            ? <>
                <p>Você entrou como <b>{usuario.email}</b>{usuario.admin && ' (administrador: pode trocar as imagens dos flashcards)'}. O seu progresso fica salvo na conta e aparece em qualquer aparelho.</p>
                <button className="botao secundario" onClick={() => sair()}>Sair</button>
              </>
            : <p>Você não entrou numa conta: o progresso fica só neste navegador. <Link to="/entrar">Entrar ou criar conta</Link></p>}
        </section>
      )}
      <section>
        <h2>Seu progresso</h2>
        <p>{usuario
          ? 'O progresso é salvo na sua conta e também neste navegador. O backup continua disponível, se quiser uma cópia.'
          : <>O progresso fica salvo <b>só neste navegador</b>. Para levar para outro aparelho ou não perder nada, faça um backup.</>}</p>
        <div className="barra">
          <button className="botao" onClick={baixar}>Baixar backup</button>
          <label className="botao secundario">Restaurar backup<input type="file" accept="application/json" hidden onChange={e => carregar(e.target.files?.[0])} /></label>
          <button className="botao perigo" onClick={zerar}>Apagar progresso</button>
        </div>
        {msg && <p className="msg">{msg}</p>}
      </section>
      <section>
        <h2>Conteúdo</h2>
        <p>{temPrivado
          ? 'Pacote privado carregado: vocabulário completo, exercícios e trechos dos livros (uso pessoal, não publicado).'
          : 'Versão pública: vocabulário, tabelas, notas comparativas e exercícios originais. Exercícios e textos dos livros não são publicados por respeito aos direitos autorais.'}</p>
      </section>
      <section>
        <h2>Digitando grego</h2>
        <p>Com “beta code” ligado, digite com o teclado comum: <code>lo/gos</code> → <span className="gr">λόγος</span>, <code>a)/nqrwpos</code> → <span className="gr">ἄνθρωπος</span>, <code>th=| qala/tth|</code> → <span className="gr">τῇ θαλάττῃ</span>.</p>
        <table className="tabela-beta"><tbody>
          <tr><td>q</td><td className="gr">θ</td><td>c</td><td className="gr">ξ</td><td>y</td><td className="gr">ψ</td><td>w</td><td className="gr">ω</td></tr>
          <tr><td>h</td><td className="gr">η</td><td>x</td><td className="gr">χ</td><td>f</td><td className="gr">φ</td><td>*</td><td>maiúscula</td></tr>
          <tr><td>)</td><td>brando</td><td>(</td><td>áspero</td><td>/</td><td>agudo</td><td>\</td><td>grave</td></tr>
          <tr><td>=</td><td>circunflexo</td><td>|</td><td>iota subscrito</td><td>+</td><td>diérese</td><td /><td /></tr>
        </tbody></table>
      </section>
    </div>
  )
}

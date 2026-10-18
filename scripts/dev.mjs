// `npm run dev`: sobe o servidor da API (porta 3000, lendo o .env) e o site do Vite (5173) juntos.
// O .env (fora do git) guarda DATABASE_URL com o endereço público do banco do Railway.
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

const env = existsSync('.env') ? ['--env-file=.env'] : []
const filhos = [
  spawn(process.execPath, [...env, '--watch-path=server', 'server/index.ts'], { stdio: 'inherit' }),
  spawn('npx', ['vite'], { stdio: 'inherit', shell: true }),
]
const parar = () => { for (const f of filhos) f.kill(); process.exit() }
process.on('SIGINT', parar)
process.on('SIGTERM', parar)
for (const f of filhos) f.on('exit', parar)

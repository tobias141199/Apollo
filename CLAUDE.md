# CLAUDE.md — Aprendendo Grego (JACT + Athenaze)

Webapp de estudo de grego antigo para falantes de português. Trabalha com **dois métodos completos, intercalados numa trilha única**: o curso **JACT, _Aprendendo Grego_** (ed. bras. Odysseus de *Reading Greek*, Cambridge) e o **_Athenaze_ Book I** (Balme & Lawall, Oxford UP, 2ª ed. 2003). Cada livro tem as suas lições próprias (vocabulário, textos, gramática, exercícios), e as "pontes" ligam uma lição à matéria correspondente do outro. Prioridade pedagógica: **vocabulário > gramática**. A gramática aparece como apoio à leitura, com tabelas para consulta e comparação.

O dono do projeto é estudante, não programador. Explique as decisões em português simples e não use jargão sem explicar.

## Regras inegociáveis

1. **Tudo tem fonte.** Toda palavra, nota, citação, exercício e tabela traz um objeto `fonte` (`livro`, `pagina`, `local`, `linhas`). Na interface isso vira uma etiqueta: "JACT · Textos · 1A · p. 6". Use a **página impressa** do livro, não a página do PDF (veja os offsets abaixo). O que for escrito por nós leva `livro: "original"`.
2. **Direitos autorais: público × privado.** Os livros são protegidos.
   - `content/public/` vai para o GitHub e para o site. Só pode conter: paradigmas (conhecimento comum), notas e comparações **redigidas por nós**, glosas curtas, referências exatas, citações **curtas** (uma frase, < 300 caracteres) com fonte, exercícios **originais** (`fonte.livro = "original"`).
   - `content/private/` fica **fora do git** (`.gitignore`). É o lugar dos exercícios dos livros, dos textos gregos completos, das listas de vocabulário com as glosas originais e das citações longas. Funciona só localmente (`npm run dev`).
   - Os testes (`npm run validate`) bloqueiam exercícios não originais e trechos longos no pacote público. `npm run build:public` verifica se algo privado vazou para `dist/`.
   - Nunca faça commit de PDFs, de `ocr/` ou de `content/private/`.
3. **Grego em Unicode NFC**, politônico, com acentos corretos. Use o ático ττ (θάλαττα, πράττω), como a JACT. Revise todo grego vindo de OCR, que costuma trocar ά/ὰ, ἀ/ἁ, ι/ί e ο/σ.
4. **Interface e notas em português do Brasil.** Comparações com o Athenaze são escritas em português; a tradução de citações do Athenaze (em inglês) é nossa.
5. **Valide sempre**: `npm test` precisa passar antes de terminar qualquer tarefa.

## Estrutura

```
content/
  public/sections/<ID>.json     # ex.: 1A.json … 7H.json (schema Secao)
  public/paradigms/<id>.json    # tabelas (schema Paradigma); id == nome do arquivo
  public/athenaze/ath<N>.json   # capítulos do Athenaze 1–16 (schema Capitulo)
  public/trilha.json            # a trilha única: etapas com seções e capítulos intercalados (schema Trilha)
  public/concordancia.json      # JACT seção ↔ Athenaze capítulo
  public/imagens.json           # imagens dos flashcards: crédito/licença de cada uma + palavra → imagem (schema CatalogoImagens)
  private/sections/<ID>.json    # mesmo schema; mesclado com o público por id
  private/athenaze/ath<N>.json  # leituras α/β completas e exercícios do Athenaze
src/content/schema.ts           # ← fonte da verdade do formato (zod)
src/content/index.ts            # carrega e mescla público + privado; monta as `Licao` (seção ou capítulo), a trilha e o vocabulário geral
src/content/schema.test.ts      # validação de todo o conteúdo
src/lib/                        # greek.ts (normalização, beta code), db.ts (Dexie), srs.ts (FSRS), selecao.tsx (lições escolhidas),
                                #   janelas.tsx (janelas flutuantes de tabelas), estudadas.ts (lições marcadas na trilha)
src/lib/nuvem.ts                # conta do usuário e sincronização do progresso com o servidor
src/pages/, src/components/     # interface (React + TS)
server/                         # servidor (Node + Hono + PostgreSQL): site + API de login, progresso e imagens
public/imagens/*.webp           # as imagens dos flashcards (≤720 px, WebP), geradas por scripts/imagens/baixar.mjs
scripts/imagens/                # buscar.mjs (candidatos + folha de contato), escolher.mjs (→ catálogo), baixar.mjs (→ WebP)
scripts/ocr.sh                  # OCR (tesseract por/grc/eng) → ocr/<livro>/page-NNN.txt
ocr/fontes/                     # textos extraídos (privado): jact-textos-secao-N.txt, jact-vocab-raw.txt
```

Ao mesclar, o privado complementa o público. No vocabulário, a entrada privada sobrescreve a pública com o mesmo lema (comparado sem acentos).

No vocabulário geral, uma palavra que aparece nos dois livros é **uma só entrada** (e um só cartão nos flashcards), com a lista de `origens` (todas as lições onde aparece). A glosa e o lema da JACT têm prioridade.

## Fontes e como extrair

| Livro | Arquivo (na raiz, fora do git) | Extração | Página impressa = página do PDF − |
|---|---|---|---|
| JACT-Textos | `Joint Association … Aprendendo Grego (0) …pdf` | `pdftotext -layout` (texto ok) | 28 |
| JACT-Gramatica | `…Gramática e exercícios (2010, Odysseus)…pdf` | OCR `por+grc` → `ocr/gramatica/` | ver cabeçalho de cada página do OCR |
| Athenaze | `Maurice Balme, Gilbert Lawall - Athenaze…pdf` | OCR `eng+grc` → `ocr/athenaze/` (a camada de texto do PDF tem o grego numa fonte antiga ilegível) | ver cabeçalho |

- Os mapas de página (qual página do PDF corresponde a cada seção ou capítulo) ficam em `ocr/fontes/mapa-gramatica.txt` e `ocr/fontes/mapa-athenaze.txt`. Nos PDFs da Gramática e do Athenaze, **cada página do PDF tem duas páginas impressas**; o número impresso está no cabeçalho do OCR.
- Quando o grego do OCR estiver ruim, abra a imagem `ocr/<livro>/img/page-NNN.png` (a ferramenta Read mostra imagens) e transcreva à mão.
- O "Vocabulário completo" da JACT (pp. 267–286) marca entre colchetes a seção em que cada palavra é aprendida (`[2B]`). É a fonte de autoridade para `aprender: true` e para `lexical`.
- Os números da JACT-Gramatica são parágrafos numerados (§). Cite-os em `local`, por exemplo `"1A–B, §8"`.

## Formato de uma seção (resumo — veja schema.ts)

```jsonc
{
  "id": "1A", "secao": 1, "parte": 1,
  "titulo": "A bordo, rumo a Atenas",          // título curto nosso
  "resumo": "…",                               // 1–2 frases nossas
  "fonte": { "livro": "JACT-Textos", "pagina": 4, "local": "1A" },
  "vocab": [{ "grego": "πλοῖον", "lexical": "πλοῖον, τό (2b)", "classe": "substantivo",
              "glosa": "navio, barco", "aprender": true, "paradigma": "decl2-neut",
              "athenaze": "cap. 3", "fonte": { "livro": "JACT-Textos", "pagina": 5, "local": "1A" } }],
  "gramatica": [{ "topico": "O artigo definido", "nota": "…", "jact": {…}, "athenaze": {…},
                  "paradigmas": ["artigo"], "exemplos": [{ "grego": "…", "traducao": "…", "fonte": {…} }] }],
  "exercicios": [{ "id": "1A-1", "tipo": "morfologia", "titulo": "…", "enunciado": "…",
                   "itens": [{ "pergunta": "…", "resposta": "…" }], "fonte": {…} }],
  "textos": [{ "grego": "…", "fonte": {…} }],          // só privado
  "athenaze": { "capitulos": ["cap. 1"], "comparacao": "…", "complementos": ["…"], "citacoes": [ … ] }
}
```

Exercícios: os do livro vão só no privado (`fonte.livro = "JACT-Gramatica"`). O livro não tem gabarito, então as respostas são nossas e levam `gabarito: "projeto"`. No público só entram exercícios originais (`fonte.livro = "original"`).

Gramática: cada grupo da JACT ("Gramática para 1C–D") fica na **primeira** subseção do grupo (1C), com `local` citando os § (ex.: `"1C–D, §16–19"`).

O campo `nota`/`comparacao` aceita parágrafos separados por linha em branco e `*ênfase*`.

## Formato de um capítulo do Athenaze (resumo — veja `Capitulo` em schema.ts)

```jsonc
{
  "id": "ath1", "capitulo": 1, "tituloGrego": "Ὁ Δικαιόπολις", "titulo": "…", "resumo": "…",
  "fonte": { "livro": "Athenaze", "pagina": 2, "local": "cap. 1" },
  "vocab": [ … ],              // todo o quadro VOCABULARY (aprender: true), glosas NOSSAS em português
  "gramatica": [ … ],          // notas nossas; `athenaze` e `jact` com a referência de cada livro
  "exercicios": [ … ],         // público: 1 original; privado: os do livro (gabarito "projeto")
  "textos": [ … ],             // só privado: leituras α e β completas, revisadas contra as imagens
  "cultura": { "titulo": "…", "resumo": "…", "fonte": { … } },   // resumo nosso do ensaio cultural
  "jact": { "correspondentes": ["1A", "1B"], "comparacao": "…", "complementos": ["…"], "citacoes": [ … ] }
}
```

Capítulo sem arquivo aparece na trilha como "em preparação". A ponte vale nos dois sentidos: se 1A aponta para o cap. 1 (`athenaze.capitulos`), o cap. 1 também mostra 1A.

## Trilha

`content/public/trilha.json` lista as etapas e, em cada uma, os passos (`licao`: "1A" ou "ath3"), com um `porque` curto escrito por nós. O teste exige que **toda seção da JACT e todo capítulo 1–16 apareçam exatamente uma vez**. Mantenha a ordem interna de cada livro (a história do Athenaze é contínua) e ponha cada capítulo ao lado das seções da JACT com a mesma matéria (veja `concordancia.json`).

## Tabelas em janelas

Cada tabela pode ser destacada (⧉) numa janela flutuante, que continua aberta ao trocar de página, ou acrescentada (＋) à janela da frente (até 5 lado a lado). Arrastar uma tabela pela barra de título para outra janela junta as duas; soltar fora a destaca. O ⧉ da janela abre `/#/janela?t=a,b,c` numa janela própria do navegador. O estado fica no localStorage (`ag:janelas`).

## Servidor, contas e banco de dados (Railway)

O site roda no **Railway** (projeto "Apollo"): um serviço Node (`server/index.ts`) que entrega o site construído (`npm run build:public`, sem o pacote privado) e a API em `/api`, mais um PostgreSQL. O Railway publica sozinho a cada push na `main`. O GitHub Pages foi desligado.

- **Sem login, sem acesso**: o servidor só entrega o site a quem entrou. Sem sessão, qualquer página redireciona para `entrar.html` (página separada, `src/entrar/main.tsx`, que não importa nada de `src/content`), e o resto (JS do site, imagens, API de progresso) responde 401. Os arquivos liberados sem login vêm do manifesto do Vite (`dist/.vite/manifest.json`, entrada `entrar.html`). **Nunca importe conteúdo do curso em `src/entrar/`.**
- **Contas** (`server/auth.ts`): e-mail e senha (scrypt) ou Google (OAuth; só com `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`). Sessão num cookie httpOnly de 180 dias; o banco guarda só o hash do token.
- **Progresso** (`server/progresso.ts` + `src/lib/nuvem.ts`): continua no navegador (Dexie + localStorage) e funciona sem internet. O que muda fica "pendente" (`marcar()`) e é enviado; o que mudou em outro aparelho é baixado (`?desde=`). Ao sair, o navegador é limpo e volta para o login. Toda gravação nova de progresso precisa chamar `marcar()`.
- **Variáveis no Railway**: `DATABASE_URL` (referência ao Postgres), `ADMIN_EMAIL` (quem pode trocar imagens; vários separados por vírgula), `NODE_ENV=production`, `PUBLIC_URL` e, para o Google, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
- **Desenvolvimento**: `npm run dev` sobe o servidor (porta 3000, lendo `.env`) e o Vite (5173, que repassa `/api`). Com `DATABASE_URL` no `.env` (o endereço público do Postgres do Railway), login, progresso e imagens funcionam localmente com os dados reais. Sem `.env`, o site funciona só com o navegador.

## Imagens dos flashcards

As imagens ficam **no banco de dados** (tabelas `imagens`, com o WebP, e `palavras_imagens`). Na primeira vez que o servidor sobe, ele copia as que estavam no projeto (`content/public/imagens.json` + `public/imagens/`); esses arquivos ficaram só como semente e como reserva se o servidor não responder. **Quem escolhe as imagens é o dono do projeto, pelo próprio site** (conta de administrador: "trocar imagem"/"remover" no verso do cartão e no verbete). Não acrescente nem troque imagens por conta própria.

## Padrão da simbiose JACT × Athenaze

Para cada capítulo do Athenaze, a ponte (`jact`) segue o mesmo padrão abaixo, com os papéis trocados.

Para cada subseção da JACT:
1. Veja em `concordancia.json` quais capítulos do Athenaze cobrem a mesma gramática e o mesmo vocabulário.
2. **comparacao** (público, nosso): como cada livro apresenta o tópico, onde um explica melhor que o outro e qual ordem de estudo recomendamos.
3. **complementos** (público, nosso): o que o Athenaze traz e a JACT ainda não trouxe (ou vice-versa), como vocabulário útil, uma regra mais clara ou um quadro.
4. **citacoes**: frases curtas de **ambos** os livros, lado a lado, ilustrando o mesmo ponto, cada uma com `fonte` exata. Citações curtas vão no público; trechos longos, no privado.
5. No vocabulário, marque `athenaze: "cap. N"` quando a palavra também aparece no Athenaze até o ponto equivalente.

## Como adicionar a próxima Parte (ex.: Parte 3, Seções 8–11)

1. Rode `scripts/ocr.sh` se ainda faltarem páginas, e extraia o texto da JACT com `pdftotext -layout` para `ocr/fontes/jact-textos-secao-N.txt`.
2. Acrescente as seções em `NOMES_SECAO`, `TITULOS_SECAO` e `PARTES` (`src/content/index.ts`) e amplie o regex de `Secao.id` se precisar.
3. Atualize `concordancia.json` (o Athenaze Book I termina no cap. 16; depois disso vem o Book II).
4. Crie `content/public/sections/8A.json…` e `content/private/sections/8A.json…` seguindo o padrão acima, e paradigmas novos em `content/public/paradigms/`.
5. Rode `npm test` e confira algumas subseções no navegador contra o PDF.

## Como adicionar o próximo capítulo do Athenaze (ex.: cap. 5)

1. Veja as páginas do PDF em `ocr/fontes/mapa-athenaze.txt` e leia `ocr/athenaze/page-NNN.txt`. Confira **todo** o grego nas imagens `ocr/athenaze/img/page-NNN.png`.
2. Crie `content/public/athenaze/ath5.json` (vocabulário com glosas nossas, gramática, cultura, 1 exercício original, ponte `jact`) e `content/private/athenaze/ath5.json` (leituras α/β, exercícios do livro).
3. Confira se o capítulo está no lugar certo de `trilha.json` e reescreva o `porque`, se preciso.
4. Rode `npm test` e abra `/#/capitulo/5` no navegador.

## Comandos

- `npm run dev`: site local com o pacote privado (http://localhost:5173) + servidor da API (veja "Servidor").
- `npm start`: o servidor de produção (o que o Railway roda).
- `npm test`: testes (grego, FSRS, validação de conteúdo).
- `npm run build:public`: build sem conteúdo privado, mais a checagem de vazamento. É o que o Railway publica.
- `npm run build`: build local completo (não publique).
- `npm run smoke`: com o `npm run dev` rodando, abre as páginas principais num Chromium headless (desktop e celular), acusa erros de JavaScript e rolagem horizontal e salva screenshots em `smoke/` (fora do git).

## Checklist ao terminar uma tarefa de conteúdo

- [ ] `npm test` verde.
- [ ] Todo item novo tem `fonte` com página impressa.
- [ ] Nada copiado dos livros em `content/public/`, exceto citações curtas.
- [ ] Grego conferido (acentos, espíritos, iota subscrito) e em NFC.
- [ ] Conferi por amostragem no navegador (`npm run dev`).

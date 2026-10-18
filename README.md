# Aprendendo Ἑλληνικά

Webapp gratuito para estudar grego antigo pelo método **JACT** (*Aprendendo Grego*, ed. bras. de *Reading Greek*), com o foco no **vocabulário** e complementos do **Athenaze**.

- **Flashcards** com repetição espaçada (FSRS, o algoritmo do Anki moderno)
- **Quiz** de múltipla escolha e de digitação, com teclado grego e *beta code* (`lo/gos` → λόγος)
- **Filtro por seção** (1A–7H): estude só o que já viu no livro
- **Tabelas de paradigmas lado a lado**, com terminações destacadas e modo de autoteste
- **JACT × Athenaze**: para cada seção, o que cada livro ensina e como um complementa o outro, sempre com a referência da página
- Sem login: o progresso fica no seu navegador (com backup em arquivo)

Por enquanto cobre as **Partes 1 e 2** da JACT (Seções 1–7).

## Rodar no seu computador

Precisa do [Node.js](https://nodejs.org) 20 ou mais recente.

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm test         # testes
```

## Direitos autorais

Este é um projeto independente de estudo, sem vínculo com a JACT, a Cambridge University Press, a Odysseus Editora ou a Oxford University Press. O repositório **não contém** os textos nem os exercícios dos livros, só:

- referências (seção, capítulo, página) para você estudar com o seu exemplar;
- tabelas de paradigmas (conhecimento comum da gramática grega);
- notas, comparações e exercícios escritos para este projeto;
- citações curtas, com a fonte.

Quem tem os livros pode montar localmente um pacote privado (`content/private/`, ignorado pelo git) com o conteúdo completo, para uso pessoal. Veja `CLAUDE.md`.

## Contribuir

O formato do conteúdo está em [`src/content/schema.ts`](src/content/schema.ts) e as convenções em [`CLAUDE.md`](CLAUDE.md). Correções de grego e glosas são muito bem-vindas.

Código sob licença MIT.

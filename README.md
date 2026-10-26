# Plenário — preview Lovable de transparência política

Este repositório é o preview navegável mantido no [Lovable](https://lovable.dev) para a plataforma brasileira de transparência política. A interface usa uma seleção de parlamentares inspirada em telas de personagens, mas mantém fontes oficiais, contexto e distinção entre fato, alegação e decisão judicial.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/640f0723-3696-4aa4-bc22-1743c191d417).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## O que está integrado

- Dados oficiais ao vivo da API da Câmara dos Deputados.
- Busca sem acentos, filtros por partido e UF, seleção, fichas e comparação.
- Histórico cadastral, proposições, comissões e despesas documentadas.
- Links de fonte junto às seções factuais e data de coleta visível.
- Timeout, limite de resposta, validação de domínio, bloqueio de redirecionamentos e repetição controlada.
- Cache em memória da última resposta válida para falhas transitórias.
- Snapshot auditável em `data/` e metodologia em `docs/`.

O painel administrativo, a persistência SQLite e o fluxo de revisão de correções continuam no repositório de desenvolvimento `politiccarreer`; não foram simulados neste preview.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Para validar o build de produção:

```sh
npm test
npm run build
```

Consulte [docs/CIVIS-EXPORT.md](docs/CIVIS-EXPORT.md) para a auditoria da exportação e os limites conhecidos.

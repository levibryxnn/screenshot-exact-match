# Estado do preview Lovable — Plenário

## Entrega atual

Preview navegável de transparência política com dados oficiais da Câmara dos Deputados. A cobertura exibida é de deputados federais retornados pela API ao vivo; a aplicação não apresenta essa amostra como cobertura completa da política brasileira.

## Stack vigente

TanStack Start, React, TypeScript, Vite, Tailwind CSS, Radix UI, Recharts, React Query e Vitest. O projeto mantém o template conectado ao Lovable em `.lovable/project.json`.

## Funcionalidades disponíveis

- Seleção de parlamentares com busca sem acentos, filtros de partido e UF e destaque do item selecionado.
- Ficha com identificação, histórico cadastral na Câmara, proposições, órgãos/comissões, cota parlamentar e seção jurídica sem casos não verificados.
- Comparação lado a lado e metodologia pública.
- Links diretos para as fontes oficiais junto às seções.
- Estados de erro, cache de última resposta válida e preferência de movimento reduzido.
- Placeholder textual quando uma foto oficial não está disponível.

## Dados e limites

A API da Câmara é a única fonte integrada no preview. TSE, Senado, DataJud, TCU, Portal da Transparência, promessas e patrimônio ainda não são anunciados como integrados. O snapshot oficial em `data/official-snapshot.json` contém 24 registros coletados em 26/10/2026 para auditoria, sem substituir a consulta ao vivo.

## Próximo incremento

Adicionar uma camada de revisão de correções e fontes compatível com o ambiente de publicação do Lovable, mantendo a revisão humana obrigatória para registros jurídicos e conteúdos potencialmente reputacionais.

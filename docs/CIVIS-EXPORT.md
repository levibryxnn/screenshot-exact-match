# Exportação CIVIS para o preview Lovable

Este repositório é o preview visual mantido no Lovable. A exportação preserva a interface TanStack Start já criada no projeto e incorpora os critérios de dados, fontes e linguagem editorial desenvolvidos no núcleo CIVIS.

## O que foi reaproveitado

- Seleção de parlamentares em formato de personagem, filtros por nome, partido e UF, ficha detalhada, comparação e movimento reduzido já existentes no Lovable.
- Classificação jurídica com dez estados processuais em `src/lib/legal.ts`.
- Consulta oficial da Câmara dos Deputados com validação de domínio, bloqueio de redirecionamento, limite de resposta, timeout e repetição controlada em `src/lib/camara.ts`.
- Última resposta válida mantida em memória durante a sessão quando a API falha; a interface identifica esse estado como dado potencialmente desatualizado.
- Links diretos para as fontes da Câmara em cada seção factual da ficha.
- Snapshot oficial e histórico em `data/`, com data de coleta e limitações documentadas.
- Pesquisa de projetos, fontes e componentes em `docs/`.

## Limites do preview

O Lovable usa TanStack Start/Vite e não recebeu o banco SQLite e o painel administrativo do núcleo Next.js. Esses componentes continuam no repositório de desenvolvimento `politiccarreer`, porque a persistência local e a sessão administrativa não são compatíveis com o destino Cloudflare padrão deste preview sem uma decisão de infraestrutura.

O preview consulta a Câmara ao vivo. O snapshot em `data/` serve para auditoria e reprodução da amostra; ele não é apresentado automaticamente como atualização atual.

## Validação

Executados antes da publicação:

- `npm test`: 5 testes passaram.
- `npm run build`: build cliente, SSR e Nitro passaram.
- `npm run lint`: passou com 6 avisos de Fast Refresh em componentes UI gerados pelo template; não há erros de lint.

O commit foi feito na branch `main`, que é a branch conectada ao projeto Lovable. Não houve force push, rebase ou alteração de histórico publicado.

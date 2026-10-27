# Pesquisa de componentes de interface

Consulta: 26/10/2026. Esta pesquisa antecedeu a implementação. Evidência primária: metadados públicos do registro npm e documentação/licenças dos mantenedores. Não foi realizada auditoria independente de segurança de cada projeto; compatibilidade declarada não substitui execução dos testes da aplicação.

## Escolha para o primeiro incremento

Next.js 16 + React 19 e TypeScript; CSS próprio para identidade, grade responsiva, seleção, navegação, barras e linha do tempo; `lucide-react` para ícones; `@radix-ui/react-dialog` para painéis modais com gestão de foco e teclado. A grade possui alternativa de navegação comum por botões, sem exigir arraste ou animações. Comparação em tabela sem pontuação e sem gráfico quando os dados não permitem séries comparáveis. Usar `prefers-reduced-motion` e foco visível. Não copiar componentes completos de catálogos para produzir uma identidade visual própria; reutilizar primitivas difíceis de implementar corretamente.

Não há custo de licença nessas dependências open source. Preservar os avisos de licença distribuídos nos pacotes; ícones devem ter nomes acessíveis quando transmitem ação e `aria-hidden` quando decorativos. A aplicação precisa testar contraste, navegação, leitor de tela e dispositivos: o uso de Radix não certifica acessibilidade.

## Avaliação

| Projeto | Evidência e compatibilidade observada | Licença/custo | Adequação e decisão |
| --- | --- | --- | --- |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | Documentação atual disponível em https://ui.shadcn.com/docs; catálogo com primitivas e componentes como dialog, filtros, navegação, sidebar e progress. Código é incorporado ao projeto e mantido por quem o copia. | [LICENSE.md](https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md) consultado: MIT, copyright 2023 shadcn. Componentes públicos gratuitos; não presumir que produtos externos tenham a mesma licença. | Referência de composição. Não adotar gerador/catálogo completo no MVP, pois CSS próprio e Radix satisfazem necessidades sem arquivos e dependências redundantes. Adaptação baixa por componente, mas manutenção do código copiado torna-se local. |
| [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/accessibility) | `@radix-ui/react-dialog` 1.3.1: peer React/React DOM 16.8–19, incluindo 19 RC. Documentação consultada descreve ARIA, roles, foco e teclado. | MIT no npm; gratuito. | **Reutilizar** Dialog. Título, descrição, fechamento, foco inicial e retorno de foco precisam ser exercitados. Sem instalar menus complexos onde links e selects nativos resolvem. |
| [Lucide](https://lucide.dev/license) | `lucide-react` 1.61.0 declara React 16.5–19; permite importar ícones individualmente. Documentação de licença consultada. | ISC; alguns ícones herdados do Feather são MIT; preservar avisos correspondentes. Gratuito. | **Reutilizar** para busca, filtros, fontes, navegação e comparação. Ícone sozinho exige rótulo acessível. |
| [Motion](https://motion.dev) | npm `motion` 14.6.0: React e React DOM ^18 ou ^19. Página específica de acessibilidade retornou 403 nesta execução; não alegar ter consultado seu conteúdo. | MIT no npm; biblioteca gratuita. Extras/serviços não foram contratados. | Não instalar inicialmente: transições discretas, hover e entradas podem usar CSS. Reavaliar para gestos/layout compartilhado, com redução de movimento e orçamento de JS. |
| [Embla](https://www.embla-carousel.com) | `embla-carousel-react` 8.6.0: peer React 16.8–19. A URL tentativa `/guides/accessibility/` retornou 404, portanto não valida conformidade. | MIT no npm; gratuito. | Adequado a carrosséis de retratos com toque. Adiar: grade/overflow nativo preservam descoberta e teclado, sem controles duplicados. Caso adotado, testar botões, anúncio da posição e pausa de autoplay; não usar autoplay no MVP. |
| [Recharts](https://recharts.org) | 3.10.1 no npm; Node >=18; peer React/React DOM/React-is 16–19. | MIT no npm; gratuito. | Adequado a despesas por período e séries eleitorais quando houver dados equivalentes e contexto. Adiar até existir série suficiente; uma tabela é mais legível para o primeiro conjunto. Gráficos futuros precisam de resumo e tabela acessível. |
| [Magic UI](https://magicui.design/docs) | Documentação e [licença do repositório](https://raw.githubusercontent.com/magicuidesign/magicui/main/LICENSE.md) acessadas. Efeitos visuais/entradas podem exigir dependências e execução cliente adicionais. | MIT confirmado para o repositório público, copyright Magic UI. Não confundir catálogo open source com ofertas comerciais; preço/produtos Pro não verificados. | Avaliado para efeitos de seleção e profundidade. Não incorporar: efeito CSS discreto satisfaz a proposta e evita ruído sobre fatos sensíveis. |
| [Aceternity UI](https://ui.aceternity.com) | Site retornou HTTP 403; licença atual dos componentes e limites das ofertas não foram confirmados nesta execução. | **Não verificada**; não copiar componentes nem assumir gratuidade/licença do catálogo inteiro. | Avaliado como candidato; rejeitado para incorporação enquanto a licença e o código específico não forem verificados. |

## Compatibilidade de base verificada

Registro npm consultado em `https://registry.npmjs.org/<pacote>/latest`: Next 16.4.3 (MIT), engine Node >=20.9; React 19.3.1 (MIT); máquina atual Node 24.19.0. As versões instaladas estão fixadas no lockfile, que é a referência operacional. Dados `latest` são uma observação datada, não uma política de atualização automática.

## Mapa das necessidades visuais

- Retratos, cards, expansão, iluminação e profundidade: CSS, botões semânticos e estado React.
- Carrossel/slides: grade e rolagem nativa no primeiro incremento; Embla se testes mostrarem necessidade real.
- Menus, navbar, sidebar: links/landmarks e controle de expansão com estado acessível; Radix se surgir interação complexa.
- Progresso e carregamento: texto e indicadores sem atribuir progresso fictício à coleta.
- Timeline: lista ordenada com datas e fontes. Não codificar categoria apenas por cor.
- Modais/painéis: Radix Dialog; fechar por Escape, foco contido e retorno ao acionador.
- Filtros: campos rotulados e selects nativos; resultados/ausência de dados visíveis e anúncio de atualização.
- Comparação: tabela com cabeçalhos, campos ausentes explícitos e contexto de cargo/período.
- Transições: CSS com `prefers-reduced-motion: reduce`; sem animação obrigatória para alcançar conteúdo.

## Limitações da pesquisa

A API `api.github.com` retornou 403 pelo proxy nesta máquina; não foi possível verificar métricas de atividade por esse endpoint. Não afirmar quantidade de contribuidores ou atividade recente sem evidência. Páginas e arquivos oficiais efetivamente acessados estão identificados acima. A escolha foi baseada no código/pacotes disponíveis e requisitos do MVP, sem copiar componentes de licença incerta.


## Redesign visual atual

A tela principal e as páginas internas usam o CSS próprio já existente. A atualização ajusta os tokens globais para marinho/dourado, preserva CIVIS e os componentes React, e mantém o tratamento acessível de foco e movimento reduzido. Os atalhos de cargo são derivados dos cargos presentes no lote de dados, sem categorias sem fonte. O hero usa um SVG arquitetônico original, criado no projeto; não substitui fotografia licenciada nem depende de biblioteca ou serviço externo. Capturas renderizadas: `docs/preview/assets/`.

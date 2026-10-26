# Pesquisa de projetos existentes

Pesquisa direta em 26/10/2026, antes da implementação. Fontes: clones rasos dos repositórios oficiais, README, manifests, licenças e organização dos diretórios. A API REST `api.github.com` respondeu `Tunnel connection failed: 403 Forbidden`; a leitura Git HTTPS pelo proxy da plataforma funcionou. Não inferimos inexistência de um projeto a partir de falha HTTP. Não executamos aplicações nem auditorias de dependências destes projetos; avaliações de segurança abaixo são limitadas à inspeção dos arquivos.

## Politicapp

- Fonte: <https://github.com/politicapp-br/politicapp>; commit `7547ca52858bd24c37cc4aa56cc6de19d9f897d5`, última alteração observada 10/08/2026. O projeto **existe e foi clonado**. Uma afirmação de inexistência em material externo não corresponde à verificação realizada.
- Objetivo: app cívico gratuito com perfis, votações, proposições e comparação contextual de despesas.
- Arquitetura: monorepo pnpm 10.6.3/Turborepo; Expo/React Native (`apps/mobile`), schemas Zod (`packages/data`) e ETL (`packages/pipeline`), TypeScript/Vitest. Node 22 no README. Pipeline gera JSON estático publicado por GitHub Actions/Pages, sem backend persistente próprio.
- Licença: **MIT**, confirmada no `LICENSE`, copyright 2026 gmferraz e colaboradores. Reutilização de código exige preservar aviso e licença.
- Integrações documentadas: Câmara, Senado, cotas/CEAPS, DivulgaCandContas e Portal da Transparência. As notas sobre limitações de APIs são pistas técnicas, não fatos que dispensam revalidação na fonte primária.
- Qualidade observável: separação clara de interface, schemas e pipeline; lockfile, scripts de tipos/testes e CI. Não executamos sua suíte.
- Segurança/dependências: credencial do Portal fica no pipeline segundo documentação. Não houve instalação/auditoria; não afirmamos ausência de vulnerabilidades. Associações por nome em conjuntos de terceiros demandam revisão: nossa identidade principal deve usar IDs oficiais.
- Adequação/esforço: alta compatibilidade de domínio; esforço alto para converter aplicativo móvel em web e adicionar armazenamento/revisão editorial. **Decisão:** usar como referência de arquitetura ETL e limitações; não transplantar a aplicação móvel. Nenhum código deste projeto foi copiado neste incremento.

## CandData

- Fonte: <https://github.com/4lessandrodev/canddata>; commit `864bb6cd6373a11c6a07d2b6ebe13557104a3ce2`, última alteração observada 28/06/2026.
- Objetivo: busca, filtros, comparação de candidatos, cola de votação, favoritos, reações e administração.
- Arquitetura: Next.js 15.5.15/React 19/TypeScript, Prisma 7.8/PostgreSQL, Redis/BullMQ, worker de sincronização, better-auth, Zod, Tailwind/shadcn/Base UI, Vitest. Pastas `src`, `prisma`, `scripts`, `wiki`, compose e manifests. Existem `yarn.lock` e `package-lock.json`; o README exige Yarn 4.
- Licença: **permissão de reutilização não confirmada**. Não há arquivo LICENSE/COPYING no clone inspecionado, package.json contém `private: true` e não declara licença; README mostra badge “license-private”. `private: true` sozinho controla publicação npm e não constitui licença. Código publicamente visível não concede automaticamente direito de adaptação. Não copiar código/assets sem autorização do titular.
- Integrações documentadas: TSE, Câmara, Senado, Portal da Transparência; autenticação, logs administrativos e edição manual.
- Qualidade observável: documentação extensa, schemas/migrations e testes presentes. Não executamos testes nem validamos todas as alegações do README.
- Segurança/dependências: documentação separa variáveis servidor/cliente e menciona guardas de acesso/SSRF; sua eficácia não foi auditada. README descreve fallback de reset de senha em log de desenvolvimento, comportamento que exigiria revisão de produção. Sem instalação/auditoria.
- Adequação/esforço: funcionalmente próximo, mas reuso bloqueado por licença não estabelecida; arquitetura completa seria mais custosa para um primeiro núcleo sem conta do eleitor. **Decisão:** referência conceitual apenas; implementação própria do domínio e uso de bibliotecas com licença verificável. Rankings/reação não são adequados à proposta editorial deste projeto.

## Serenata de Amor / Jarbas

- Fonte: <https://github.com/okfn-brasil/serenata-de-amor>; commit `e7aeba78100b1ec96c2a79a85d6f5dfd1a8adaf7`, última alteração observada 31/01/2024.
- Objetivo: fiscalização de reembolsos parlamentares, pesquisa de dados e interface Jarbas; organização em `rosie`, `research`, `jarbas`.
- Arquitetura: Python/Django, Celery/PostgreSQL, Elm e Gulp. Manifest inspecionado fixa Django 2.1.7, DRF 3.9.1, requests 2.21.0, Elm 0.18/Gulp 3.
- Licença: **MIT**, confirmada no LICENSE (Data Science Brigade, 2017), preservação de avisos exigida.
- Qualidade/integrações: pesquisa e aplicação separadas, documentação e integração de despesas. Nenhum teste executado.
- Segurança/manutenção: versões de gerações antigas indicam elevado trabalho de atualização; não foram enumeradas vulnerabilidades nem feita auditoria. Último commit observado não comprova suporte operacional atual.
- Adequação/esforço: útil como referência histórica de transparência e investigação, pouco adequado como base web atual; atualização de stack e escopo seria grande. **Decisão:** não incorporar código nem classificadores de suspeita. Uma anomalia estatística jamais será convertida em acusação.

## Brasil.IO

- Fonte: <https://github.com/turicas/brasil.io>; commit `e117eb03442994b82255b9e9025b5a8327c7a6fc`, última alteração observada 02/09/2026.
- Objetivo: liberar, limpar, enriquecer e disponibilizar datasets públicos consultáveis e para download.
- Arquitetura: Python/Django (manifest >=4.2,<4.3), DRF, PostgreSQL, Redis/RQ e armazenamento de arquivos; `api`, `core`, `brazil_data`, `docs`, Docker/compose, pytest.
- Licença: **GPL v3**, confirmada no LICENSE e README. Incorporação/distribuição de código derivado traz obrigações copyleft; licença dos datasets deve ser verificada separadamente da licença do software.
- Qualidade observável: estrutura modular, documentação, configuração de testes/CI. Não executamos a suíte.
- Segurança/dependências: ranges de versões e dependências obtidas de GitHub exigem avaliação/locking para reuso. Sem auditoria ou validação de suporte da versão Django.
- Adequação/esforço: bom padrão de catálogo/proveniência, escopo de portal de dados mais amplo e stack distinta; adaptação substancial. **Decisão:** referência de dados abertos e eventual fonte complementar após verificar licença/atualização de cada dataset; não incorporar código GPL neste incremento.

## Conclusão vigente

Construir o domínio cívico web próprio, sem copiar os projetos estudados; reutilizar bibliotecas de interface/validação com licenças verificadas e concentrar a primeira ingestão na API oficial da Câmara. Não houve fork, reempacotamento de código terceiro ou importação de acusações. Critérios de seleção e ausências serão públicos; quantidade de registros disponíveis não representa juízo moral. Evidência Git e arquivos substituem inferências baseadas em acesso HTTP isolado. Atividade registrada é o último commit do clone inspecionado, não uma garantia de manutenção futura.

## Pesquisa complementar no GitLab — Controle Popular

Esta extensão da pesquisa foi feita **após o primeiro núcleo de implementação**, em 26/10/2026, quando o acesso à API GitLab foi confirmado. Não reclassifica a cronologia da pesquisa inicial GitHub. Consulta: <https://gitlab.com/api/v4/projects?search=transparencia&simple=true&per_page=3>; candidato brasileiro analisado: <https://gitlab.com/FinweeJur/controle-popular>, identificado pelo próprio projeto como espelho de `github.com/FinweeJur/controle-popular`.

1. **Finalidade/funcionalidades:** portal independente de transparência, com dados por município/tema, contratos, assembleias, Congresso, Judiciário e temas ambientais. README declara lacunas explícitas e fontes junto aos números. Funcionalidades descritas não foram testadas nesta pesquisa.
2. **Stack/arquitetura:** API `/languages` reportou TypeScript 34,8%, TSX 30,1%, Python 24,34%, JavaScript 8,41%, CSS 0,9%. Monorepo npm workspaces (`apps/*`), diretórios ETL, modelos, scripts, documentação e Supabase. Manifest `apps/web/package.json`: Next ^16.3.6, React 19.2.4, Drizzle, PostgreSQL/Neon, Tailwind, Motion/GSAP, Lucide e bibliotecas 3D; Vitest para testes.
3. **Licença:** arquivo LICENSE contém GNU Affero GPL v3; README/package.json declaram **AGPL-3.0-or-later**, em concordância com metadados GitLab. Código derivado servido em rede exige cumprir obrigações de disponibilização de fonte aplicáveis; dados/fontes têm condições próprias a verificar. Nenhum código ou ativo incorporado.
4. **Manutenção:** atividade do projeto observada em 25/10/2026; último commit retornado por `/repository/commits?per_page=1`: `78d70fbfacc59627e4642949d63646bfdb63a4b7`, 24/10/2026, registro de vigia de coletores por bot. Atividade automática recente não comprova suporte humano ou revisão editorial.
5. **Organização/qualidade:** README com índice de produto/estado/setup/operação/fontes; pastas `apps`, `etl`, `docs`, `scripts`, `models`, workflows e configuração gitleaks. A presença desses arquivos é evidência de organização, não de qualidade validada; nenhuma suíte executada.
6. **Integrações:** README oferece documentação pública `/api`, OpenAPI e datasets versionados `/api/v1/`; fontes por eixo ficam no catálogo documental. Manifest inclui AWS S3 e PostgreSQL/Neon. Não foram feitas chamadas funcionais aos datasets nem verificação individual dos coletores.
7. **Segurança/dependências:** manifest possui script `npm audit --omit=dev`, hooks e política de detecção de segredos; apenas leitura, sem instalação ou auditoria executada. O conjunto amplo de integrações e bibliotecas exige avaliar superfície de ataque, segredos, versões e proveniência antes de eventual reuso. Não alegamos ausência de vulnerabilidades.
8. **Compatibilidade:** conceitos de proveniência, lacunas, ETL e APIs versionadas são compatíveis; escopo municipal/ambiental e portal multifrente difere da seleção documental de políticos. Não transplantar narrativas/classificações sem revisão factual própria.
9. **Esforço/decisão:** adaptação de monorepo amplo e suas fontes seria alta e envolveria decisão explícita de licença AGPL e investigação operacional. **Referência complementar, sem cópia ou adaptação de código neste MVP**; considerar interoperabilidade via dados documentados após validar licenças, qualidade e atualização de cada endpoint.

Evidências consultadas via API GitLab: projeto `87027844?license=true`, `/languages`, `/repository/tree?per_page=100`, `/repository/commits?per_page=1` e arquivos raw `README.md`, `LICENSE`, `package.json`, `apps/web/package.json`. Nenhuma instalação, auditoria ou teste deste projeto foi executado.

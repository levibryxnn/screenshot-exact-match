# Estado do projeto — 27/10/2026

## Objetivo e entrega atual

Núcleo funcional de consulta documental de parlamentares federais em exercício. A busca atual reúne a lista corrente completa da Câmara e do Senado; ainda não é cobertura completa da política brasileira. Referência do Gemini analisada, não tratada como evidência de dados, backend ou testes (GEMINI-REVIEW.md).

## Arquitetura vigente / stack

Next16.4.3, React19.3.1, TypeScript, Node24, SQLite node:sqlite, Zod, Radix Dialog, Lucide e CSS próprio. UI pública SSR com ilhas interativas, conector server-side, persistência e edição isoladas. Sem serviços pagos, sem infraestrutura publicada. Repositório: `src/app`, `src/components`, `src/lib`, `scripts`, `data`, `tests`, `docs`.

## Dados e integrações

API real Câmara v2: lista/detalhe, histórico, retratos e proposições. Serviço atual do Senado: lista de parlamentares em exercício, mandato, legislatura e partido/UF. Última coleta: 513 deputados e 81 senadores em exercício (27/10/2026). Até 5 propostas por deputado; contagem é cobertura importada, não produção total. Seleção da Câmara é alfabética, sem representatividade estatística alegada. IDs oficiais e fontes por registro, sem contatos pessoais ou acusações.

Modelo: politicians com ID `camara:<id>` ou `senado:<id>`, versões JSON e checksum; import_runs; corrections; editorial_records; audit. Fonte guarda datas distintas de evento/publicação/coleta/verificação, órgão, URL, identificador, trecho, tipo e verificação. Histórico oficial2015 separado. Snapshot atual permite inicialização offline; renovação pelo importador. SQLite mantém lotes anteriores/versões e publica apenas lote ativo na seleção. Perfis antigos continuam referenciáveis com data explícita.

## Concluído

Seleção estilo personagem com retratos oficiais da Câmara e fallback tipográfico para a lista do Senado, pesquisa sem acentos, filtros cargo/partido/UF/situação, paginação, perfil detalhado, timeline, proposições, modal de fonte, comparação2–4, movimento reduzido, teclado, mobile e estados de falha/ausência/dados antigos. API com validação/paginação. Atualização transacional, timeout/retry/domínio restrito e logs. Correções persistidas privadamente. Admin desativado sem senha, sessão assinada/HttpOnly, revisão sensível, aprovação/rejeição com justificativa e auditoria. Revalidação pública de registros sensíveis vencidos evita apresentação como situação vigente.

## Decisões técnicas

SQLite para reduzir pré-requisitos e custo no MVP; PostgreSQL/worker quando carga justificar. CSS e tabelas evitam bibliotecas redundantes de gráficos/carrosséis. Radix cuida do foco em diálogos. Retratos são carregados da URL oficial retornada pela Câmara, sem cópia local, com validação do ID e fallback tipográfico; os termos de reutilização devem ser revisados antes de distribuição fora da fonte oficial. Não houve cópia de código dos projetos cívicos pesquisados; bibliotecas reutilizadas têm licença conferida. Nenhum resumo por IA é publicado como prova.

## Validação efetivamente executada

- Instalação `npm ci` com lockfile repetida; `npm audit`: zero vulnerabilidades conhecidas reportadas (não é auditoria completa).
- `npm run typecheck`: passou após a integração da lista do Senado e expansão para 513 deputados.
- `npm test`:28 testes passaram,0 falhas,0 ignorados. Dados/IDs/duplicatas/datas/fontes, SQL/filtros/paginação, cache/retries/SSRF, nulos reais, versões/lote ativo, dez estados jurídicos, revisão humana, expiração, auditoria, limite real de corpo, origem, senhas/sessões e adulteração.
- `npm run build`: passou sem warnings após correções. A página inicial usa resumos dos cards para reduzir o SSR; o perfil consulta o registro completo.
- `npm run db:init`:594 registros (513 Câmara + 81 Senado); repetição preservou base.
- `npm run data:import -- --source=camara --limit=513 --snapshot`:513 registros oficiais persistidos; `--source=senado --snapshot`:81 registros oficiais persistidos. Falhas anteriores registradas, cache preservado.
- Navegador Playwright/Chromium: busca/filtros/seleção/empty, perfil correto, fonte/foco/Escape, comparação, autenticação/CSRF, pedido persistido privado, rascunho inválido bloqueado e rejeição; desktop/mobile390/reduced-motion. **6/6 passaram em 21,0s**, sem variável de origem pública para exercitar o padrão. Axe: zero violações WCAG A/AA nas telas testadas, sem alegação de certificação. Medição local Chromium1280×720 sem throttling:TTFB195ms,DOMContentLoaded341ms,load1731ms,8 solicitações JS/162316bytes; não é Lighthouse nem previsão de rede móvel. Evidências: `test-results/home-desktop.png`, `test-results/home-mobile.png`, `playwright-report/index.html` (geradas e ignoradas no Git).

## Bugs encontrados e corrigidos

Nulos em situação e ementa oficiais; perfil com parâmetro URL codificado; CSP de desenvolvimento impedia hidratação; landmarks main aninhados; foco perdido na troca de seleção; origem localhost/127 difere em Next; revisão sensível expirada; limite global indevido da fila pública; limite de corpo só por header. Há testes de regressão relevantes.

## Pendências / limites

Não integrados: TSE/DataJud/TCU/Transparência, votos/despesas, promessas, patrimônio, resultados eleitorais completos, municípios, assembleias estaduais e câmaras municipais. Retratos da Câmara são URLs oficiais exibidas por proxy; termos de reutilização e crédito ainda exigem revisão antes de distribuição externa. O Senado está integrado para a lista corrente, mas ainda sem proposições e votações. Não há atestado de inexistência de processos. Admin de identidade única, sem MFA/dupla revisão, triagem detalhada de correções ou notificação. Editor ainda usa JSON no fluxo sensível. Cron documentado mas não instalado; deploy não publicado; nova tarefa/snapshot da nuvem ainda não validada. Limitação de tráfego em memória é local, requer proxy/Redis para múltiplas instâncias. Banco exige volume persistente/backups. Revisão jurídica humana necessária antes de conteúdo de risco. Não há teste em dispositivos físicos, Lighthouse, pentest ou auditoria jurídica completa.

## Próximo incremento

1. Integrar o catálogo eleitoral do TSE por eleição: candidaturas, resultados, bens, propostas, fotos e cassações, sem tratá-lo como prova automática de exercício atual.
2. Adicionar proposições e votações do Senado e ampliar Câmara/Senado para despesas e votos com período e competência contextualizados.
3. Criar adaptadores oficiais para assembleias estaduais e câmaras municipais; TSE servirá como camada eleitoral, não como substituto de cada casa legislativa.
4. Triagem de correções, edição granular com fontes por campo, cron/monitoramento e autenticação multiusuário com dupla revisão de material sensível.

## Ambiente na nuvem

`install_script` e `start_skill` salvos no rascunho do ambiente, junto dos domínios de pesquisa e API. Instalação limpa, inicialização repetida e build executados com sucesso. Servidor de produção reiniciado e GET de saúde/lista/perfil real validados. Configuração salva não significa publicação: revisar/salvar nas configurações do ambiente e publicar é ação do usuário. Não foi validada restauração em nova tarefa. Capturas persistidas em `docs/screenshots/`.

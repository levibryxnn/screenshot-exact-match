# PLENÁRIO — índice público da política brasileira

Aplicação web funcional de transparência política. Interface de seleção, pesquisa, filtros, perfis com proveniência e comparação, apoiados por importações oficiais da Câmara e do Senado e SQLite persistente. Sem notas de honestidade, recomendação de voto ou acusações geradas.

Esta branch contém o núcleo funcional do PLENÁRIO. A versão anterior baseada no template Lovable foi preservada na branch [`lovable-preview-legacy`](https://github.com/levibryxnn/screenshot-exact-match/tree/lovable-preview-legacy); a migração foi feita em commits normais, sem reescrever o histórico.

## Executar

Nome público do produto: **PLENÁRIO**. O prefixo de configuração `CIVIS_*` e o caminho `var/civis.db` são mantidos para compatibilidade com ambientes e dados já existentes.


Requer **Node 24**, npm e disco local persistente. Use o checkout existente; tarefas na nuvem já são isoladas, não crie worktree adicional.

```bash
cd /workspace/screenshot-exact-match
npm ci --cache /tmp/civis-npm-cache
npm run db:init
npm run dev
```

O banco é criado em `var/civis.db` e carrega o snapshot oficial sanitizado quando estiver vazio. Não é necessário segredo para navegar. Desenvolvimento usa porta 3000. Para execução de produção:

```bash
npm run build
npm run start
```

Dados retidos em disco sobrevivem a reinícios; processos precisam ser iniciados novamente. Não hospede o banco SQLite em filesystem efêmero. Não há deploy ou serviço pago contratado.

## O que está implementado

- Seleção de perfis com tema editorial marinho e dourado, hero com ilustração arquitetônica original, busca tolerante a acentos, filtros reais por cargo/partido/UF/situação e paginação.
- Menu lateral responsivo com foco acessível, fechamento por Escape, animação reduzível e navegação por toque; utiliza Radix Dialog e tokens CSS do Open Props (MIT).
- Perfis navegáveis, histórico parlamentar, até cinco proposições por deputado e citações junto dos registros.
- Comparação factual de até quatro pessoas, com contexto e lacunas visíveis.
- Importador real com domínio restrito, timeout, repetição controlada, validação e persistência transacional.
- Versões dos dados, histórico de importações e cache preservado em caso de falha.
- Pedidos de correção persistidos e privados; área editorial autenticada, rascunhos, aprovação/rejeição de registros jurídicos e auditoria.
- Alertas de dados antigos, conteúdo indisponível e falha de atualização; teclado, movimento reduzido e layout móvel. Cabeçalho e navegação receberam revisão visual sem alterar rotas ou estado de dados.

Snapshots oficiais: **513 deputados** e **81 senadores em exercício**. A Câmara inclui até cinco proposições recentes por deputado; os 81 senadores vêm da lista corrente do Senado. Esses números descrevem os lotes importados, não a totalidade de suas atividades. [Proveniência e limitações](docs/SNAPSHOT.md). Capturas atuais em [docs/preview](docs/preview/index.html).

## Atualizar dados

```bash
npm run data:import -- --source=all
# Opcional: atualizar os snapshots versionáveis, sem contatos ou dados sensíveis
npm run data:import -- --source=all --snapshot
```

Somente a opção explícita `--snapshot` modifica o arquivo de dados distribuído. Importação administrativa altera apenas o banco. Um lote bem-sucedido substitui a seleção ativa, preservando perfis anteriores, versões e vínculos. Falha retorna código diferente de zero e não substitui o lote.

A estrutura permite execução periódica externa. Exemplo de cron no host de implantação (não instalado automaticamente):

```cron
0 */6 * * * cd /caminho/screenshot-exact-match && /caminho/npm run data:import -- --source=all >> var/import.log 2>&1
```

Monitore `import_runs`/painel. Evite execução concorrente; a cobertura atual é federal e ainda não inclui assembleias estaduais ou câmaras municipais. Destinos: `registry.npmjs.org`, `dadosabertos.camara.leg.br` e `legis.senado.leg.br`; GitHub para fontes históricas/pesquisa. As consultas correntes não exigem chave na versão atual.

## Administração

Sem `CIVIS_ADMIN_PASSWORD` (mínimo 16 caracteres), a administração fica desativada. Defina uma senha própria em variável de ambiente segura, junto de `CIVIS_ADMIN_NAME` para identificar o responsável. Nunca use senha de exemplo nem a inclua no repositório. Em desenvolvimento, Node pode ler arquivo `.env.local` ignorado pelo Git; o importador CLI usa as variáveis exportadas pelo processo.

Sessão HttpOnly/SameSite Strict, cookie Secure em produção, HMAC e invalidação ao alterar senha. Chave local em `var/session.key` (0600), ou `CIVIS_SESSION_KEY` com pelo menos 32 caracteres fornecida pela infraestrutura. Por trás de proxy reverso, configure `CIVIS_PUBLIC_ORIGIN` com a origem HTTPS pública exata e preserve host/origem. Faça backup do banco e mantenha a chave fora de arquivos públicos. O MVP usa uma identidade administrativa por instalação: múltiplos usuários, MFA e separação entre revisor e aprovador são próximos incrementos.

Veja [contrato editorial](docs/EDITORIAL.md). Registros de processos não são importados automaticamente; nenhum processo foi incluído como conteúdo de demonstração. Validadores não substituem consulta ao documento ou revisão jurídica.

## Verificar

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --cache /tmp/civis-npm-cache
```

E2E inicia seu próprio servidor de produção na porta 3100, banco temporário e senha aleatória, sem alterar a base de desenvolvimento. Usa `/usr/bin/chromium` quando disponível; em outro ambiente instale o navegador oficial do Playwright com `npx playwright install --with-deps chromium`. Fixtures fictícias estão identificadas e isoladas nos testes. Testes de integração simulados exercitam falhas; a importação real é uma verificação separada, documentada em [estado do projeto](docs/STATUS.md).

## Limites desta versão

TSE, DataJud, TCU e Portal da Transparência foram pesquisados, mas ainda não estão integrados. O Senado já fornece a lista corrente de parlamentares; proposições e votações ainda serão adicionadas. O TSE será usado para histórico eleitoral, candidaturas, resultados, bens e contas, sem substituir a fonte legislativa do mandato atual. Votos nominais, despesas, patrimônio, promessas, histórico eleitoral completo, municípios, assembleias estaduais e câmaras municipais continuam pendentes. Retratos oficiais da Câmara são carregados por URL quando disponíveis, com fallback e sem cópia local. Município não é inferido de UF. Ausência de registro não significa ausência de atuação ou processos.

A fila de correções recebe pedidos e os mostra ao editor; triagem com prazos, notificação ao solicitante e edição granular de fatos cadastrais ainda não existem. O fluxo sensível permite criar, aprovar e retirar registros com justificativa. Não há pesquisa jurídica exaustiva nem equipe jurídica contratada. Antes de lançamento público amplo: revisão jurídica/LGPD proporcional, backups, observabilidade, origem HTTPS, limitação de tráfego no proxy e gestão de múltiplos editores.

Rate limiting local atende uma instância e não substitui limite no proxy/Redis em múltiplas instâncias. CSP permite scripts inline necessários ao Next (nonce estrito é melhoria futura); `unsafe-eval` só em desenvolvimento. SQLite não é arquitetura de alta concorrência. [Arquitetura](docs/ARCHITECTURE.md).

## Pesquisa e continuidade

- [Projetos e licenças](docs/research-projects.md)
- [Componentes visuais](docs/research-ui.md)
- [Fontes oficiais testadas](docs/research-sources.md)
- [Análise do HTML do Gemini](docs/GEMINI-REVIEW.md)
- [Estado, testes e próximo incremento](docs/STATUS.md)

Nenhum código de CandData ou dos projetos de transparência pesquisados foi copiado. Dependências mantêm suas próprias licenças: Next/React/Radix/Zod/Open Props MIT, Lucide ISC e alguns ícones herdados MIT; ferramentas de teste possuem licenças próprias. A licença de dados/fotografias deve ser verificada separadamente da licença de software.

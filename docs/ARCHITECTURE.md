# Arquitetura vigente

Next.js App Router, React, TypeScript, Node 24, Zod, CSS próprio, Radix Dialog e Lucide. SQLite (node:sqlite) no disco local em `var/civis.db`: operação simples, sem custo de serviço e sem segredo de banco neste MVP. Aplicação deve rodar em processo Node com disco persistente; não usar filesystem efêmero/serverless como banco de produção. Acesso SQL encapsulado em repositório; migração PostgreSQL e worker dedicado são próximo incremento, não funcionalidades entregues.

`src/app`: páginas públicas SSR e rotas HTTP; `src/components`: interação; `src/lib`: contrato, validação, persistência, fonte oficial, política editorial; `scripts`: inicialização/importação; `data`: amostra oficial com proveniência; `tests`: testes executáveis; `docs`: pesquisa/metodologia/estado.

IDs estáveis `camara:<id>` usam identificador oficial, nunca junção por nome. Fonte contém datas distintas de fato/publicação/coleta/verificação; desconhecidas permanecem nulas. Snapshot principal foi coletado da API oficial em 26/10/2026; o arquivo histórico de 2015 permanece separado com referência explícita. Nenhum dos dois se torna atual apenas por ser restaurado. Atualização é transacional: falhas preservam os dados anteriores e registram execução falha. O importador não altera conteúdo editorial aprovado/rejeitado. Dados sensíveis exigem revisão humana explícita; metadados do DataJud não são prova da decisão.

Escopo: Câmara dos Deputados, cobertura limitada publicada na metodologia. Sem pontuação moral, recomendação de voto ou inferência de inexistência de processos. Senado/TSE/TCU/DataJud/Transparência são pesquisados e não anunciados como integrados. Fotos só se houver autorização verificável; alternativa por iniciais até confirmação. Sem fotos geradas de pessoas reais.

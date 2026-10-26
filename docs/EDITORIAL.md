# Revisão de informações sensíveis

MVP com um editor autenticado por instalação. A senha exclusiva é obrigatória e não há credencial padrão. A identidade `CIVIS_ADMIN_NAME` identifica o responsável na auditoria; não representa autenticação individual multiusuário. Separação de papéis e dupla aprovação não estão implementadas.

1. Conferir documento oficial integral, decisões posteriores, envolvimento individual, natureza e manifestação do envolvido. Não acessar sigilo. Não usar IA ou notícia como prova suficiente.
2. Criar rascunho em `/admin` com ID interno, título, justificativa e objeto JSON `LegalRecord` do contrato em `src/lib/types.ts`.
3. Revisar o JSON e suas fontes. Aprovação exige documento oficial individualizado HTTPS, `source.kind=primary`, `source.verification=reviewed`, `source.verifiedAt`, revisor igual ao da sessão, justificativa e cronologia cujo último desfecho corresponde ao estado declarado. Link de perfil parlamentar não comprova processo.
4. Aprovar ou rejeitar/retirar com justificativa. A automação não toca essa tabela; aprovação/rejeição registra auditoria. Retirada não apaga histórico. Publicações com verificação vencida são retidas da apresentação como situação vigente até nova revisão (continuam no banco/auditoria).
5. Para atualizar desfecho: criar novo rascunho com cronologia completa, aprovar e retirar o registro anterior com justificativa. Gestão de versões públicas por caso e dupla aprovação são pendências; não publicar duas situações contraditórias.

Campos obrigatórios: id, title, nature, status, summary, body (órgão), caseNumber, individualInvolvement, defense (string ou null), verifiedAt ISO, reviewer, reviewReason, source, history. Citation: id, publisher, title, url, documentId (ou null), eventDate/publishedAt/verifiedAt (ou null conforme contrato), collectedAt, excerpt (ou null), kind e verification. O nome correto da data de publicação no JSON é `publishedAt`.

Estados: allegation, investigation, formal-accusation, ongoing, appealable-conviction, final-conviction, acquittal, dismissed, annulled, other. Naturezas independentes: criminal, civil, electoral, administrative. Não classificar automaticamente por popularidade ou converter metadado DataJud em decisão.

Barreiras determinísticas identificam inconsistências e linguagem inadequada, mas não confirmam a veracidade de um documento. O editor é responsável pela análise; a primeira publicação de risco elevado depende de revisão jurídica proporcional. Nenhum processo ou acusação foi preenchido para aparentar completude.

Pedidos de correção: armazenados privadamente e associados a ID existente, texto e URL HTTPS. Não são buscados pelo servidor (evita SSRF), não viram conteúdo público e não removem fatos automaticamente. A consulta do link é decisão do editor. Não coletar dados pessoais desnecessários. O MVP não oferece SLA, e-mail ou resposta automática.

# Pesquisa de fontes oficiais — 26/10/2026

## Escopo e evidência

Esta pesquisa separa **conectividade**, **documentação** e **integração implementada**. HTTP 200 de uma página não comprova acesso à base, completude, licença de imagens ou disponibilidade de todos os endpoints. A primeira tentativa para os sete órgãos recebeu `Tunnel connection failed: 403 Forbidden` no proxy; após atualização das permissões de rede, uma nova rodada obteve os resultados abaixo. Não se contornou autenticação ou verificação TLS.

### Câmara dos Deputados — integração prioritária

Documentação: https://dadosabertos.camara.leg.br/swagger/api.html ; especificação: https://dadosabertos.camara.leg.br/api/v2/api-docs ; repositório oficial: https://github.com/camaradosdeputados/dados-abertos . O README oficial informa JSON/XML via REST e arquivos CSV, JSON, XML, XLSX e ODS. Requisições testadas sem chave de API retornaram JSON com envelope `{dados, links}`. A especificação oficial foi lida (HTTP 200): informa 15 itens por padrão e máximo de 100 por requisição, suporte GET/HEAD e API ainda incompleta/sujeita a mudanças; não declara `securityDefinitions` no documento observado. A rota tentada `/termsOfService` devolveu HTTP 200 com conteúdo “Página não encontrada / Status: 400”, portanto não foi usada como comprovação de termos ou licença.

| Requisição realmente executada | Resultado observado |
| --- | --- |
| `/api/v2/deputados?itens=2&ordem=ASC&ordenarPor=nome` | 200, lista paginada, primeiro registro ID `204379`, Acácio Favacho, MDB/AP, legislatura 57 |
| `/api/v2/deputados/178957` | 200, objeto com `nomeCivil`, `ultimoStatus`, `escolaridade`; `ultimoStatus.data=2019-01-31`, `situacao=Fim de Mandato` |
| `/api/v2/deputados/178957/historico` | 200, lista com partido, UF, legislatura, `dataHora`, condição e descrição do status |
| `/api/v2/proposicoes?idDeputadoAutor=178957&itens=2&ordem=DESC&ordenarPor=id` | 200, lista com ID, tipo, número, ano, ementa, data de apresentação |
| `/api/v2/deputados/178957/despesas?ano=2025&itens=2` | 200, lista **vazia**; ausência de registros para esse filtro não comprova ausência universal de gastos |
| `/swagger/api.html` | 200, documentação que referencia a especificação acima |

Campos da lista: `id`, `uri`, `nome`, `siglaPartido`, `uriPartido`, `siglaUf`, `idLegislatura`, `urlFoto`, `email`. O identificador `id` é preservado como `officialId`; o identificador interno usa `camara:<id>`. Não se cruza identidade apenas por nome. Uma consulta individual pode trazer CPF, e-mail e telefone: estes não integram o modelo público nem são persistidos pelo importador. Datas e atributos ausentes podem ser `null`, inclusive campos de situação/ementa, conforme os testes reais da implementação; a apresentação precisa manter ausência explícita.

`ultimoStatus` é o último status conhecido, **não uma prova automática de mandato atual**. Histórico de votação nominal não equivale a presença geral. Vínculo de autoria de proposição não equivale a aprovação ou implementação. A consulta de proposições é limitada na primeira entrega e sua contagem não é indicador de produtividade. Para detalhar tramitação, autoria conjunta, votação e despesas, consultar endpoints próprios e manter período/contexto.

A amostra da API usa os primeiros 24 nomes em ordem alfabética segundo a fonte, sem seleção por partido ou ideologia. É uma regra reprodutível de cobertura inicial, não uma amostra estatisticamente representativa do país. Paginação, timeouts, tentativas limitadas e publicação transacional evitam substituir o cache por uma importação parcial.

### Fonte histórica oficial de contingência

Foi confirmado o checkout oficial `camaradosdeputados/dados-abertos`, commit `66a902e32b02b1ef43e273dac73384998e9c1c9f`. O arquivo `dados-extras/votacoes/fontes/PlenVotos-L55.csv` contém IDs oficiais, nomes, partido, UF e data de registros de votação da 55ª legislatura. O fallback documentado em [SNAPSHOT.md](SNAPSHOT.md) preserva SHA-256, linhas e critério de seleção. Os registros de 03/02/2015 são rotulados **históricos**, sem inferir cargos ou partidos atuais. A documentação oficial observa limitações no vínculo de IDs históricos; essa limitação acompanha a proveniência. Não há cópia de lógica de software desse repositório.

### Fotografias e direitos

A API fornece URLs oficiais `https://www.camara.leg.br/internet/deputado/bandep/<id>.jpg`, mas **URL pública não comprova autorização irrestrita de reutilização nem crédito do fotógrafo**. A integração atual conserva a URL oficial retornada pelo cadastro, valida o host e o ID parlamentar, e exibe a imagem por proxy do servidor sem copiar o arquivo para o repositório. A URL pública ainda não comprova autorização irrestrita nem o crédito do fotógrafo; os termos aplicáveis devem ser revisados antes de qualquer redistribuição ou cache externo. O mesmo cuidado vale para fotos do Senado. Não se assume que a licença de dados cubra automaticamente imagens.

## Fontes complementares pesquisadas

| Fonte | Endereço e teste | Utilidade e limitação para esta entrega |
| --- | --- | --- |
| Senado | https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json — **200 JSON**; https://www12.senado.leg.br/dados-abertos — **200 HTML** | A lista corrente existe e o portal descreve dados administrativos/legislativos abertos. Estrutura própria, não idêntica à Câmara; é necessária identidade oficial do Senado e reconciliação documentada. Não integrado ao importador MVP. Não foi necessário token para esta consulta específica. |
| TSE | https://dadosabertos.tse.jus.br/ — **200 HTML** | Catálogo acessível. Candidaturas, resultados, bens e prestações de contas devem ser importados por eleição e conjunto efetivamente disponível. Nenhum arquivo eleitoral foi baixado ou validado nesta rodada; cobertura, licença específica, schema e limites ainda precisam ser conferidos antes da integração. Não é uma API universal de perfis. |
| CNJ / DataJud | https://www.cnj.jus.br/sistemas/datajud/api-publica/ — **403 HTTP**; https://datajud-wiki.cnj.jus.br/api-publica/ e `/acesso/` — bloqueio 403 do túnel | Documentação não validada neste ambiente. Não houve consulta processual nem extração de chave. Necessário confirmar instruções oficiais de acesso, chave pública vigente, tribunal/índice e escopo permitido. DataJud é fonte de metadados: não fornece por si só o teor de decisão nem permite inferir culpa ou vincular homônimos. Não integrado e não é pré-requisito do recorte legislativo. |
| Portal da Transparência | https://portaldatransparencia.gov.br/api-de-dados — **200 HTML** | Documentação lida informa cadastro de e-mail para token; limite publicado de 400 requisições/minuto entre 06:00–23:59 e 700 entre 00:00–05:59. Esses valores são observações da página em 26/10/2026, devem ser revalidados. Nenhum token solicitado ou endpoint autenticado executado. Não confundir despesas de campanha/TSE com dados administrativos desta API. |
| TCU | https://portal.tcu.gov.br/dados-abertos/ — **200 HTML**, redirecionado sem barra | **O conteúdo é página de proteção “Acesso Bloqueado por Segurança”**. Não houve acesso útil ao catálogo ou a decisões. O status 200 não é integração bem-sucedida. Não se deve automatizar contorno de proteção. Um conector futuro precisa de catálogo/rota oficial acessível e documentação validada. |

## Contrato mínimo e governança

A implementação separa perfil, eventos, proposições e registros jurídicos. Cada afirmação traz órgão, URL original, identificador, data do fato quando disponível, publicação quando conhecida, coleta, verificação, trecho/localização e tipo de evidência. Data de coleta não substitui data factual; importação oficial não equivale a revisão jurídica.

Registros jurídicos têm natureza (criminal, civil, eleitoral, administrativa) e estados distintos para alegação, investigação, acusação formal, processo em andamento, condenação recorrível, trânsito em julgado, absolvição, arquivamento, anulação/reforma e outros desfechos. Não existe coleta automática de acusações por nome, classificação por popularidade ou conteúdo sensível inventado para preencher perfis. A publicação exige documentação individual, decisão/órgão, defesa quando disponível e revisão humana registrada. Ausência de casos publicados significa **informação ainda não verificada**, nunca “nada consta”.

Amostras limitadas, endpoints ainda não integrados e fontes inacessíveis permanecem declarados. Não há alegação de cobertura nacional, auditoria jurídica completa, atualização contínua de todos os órgãos ou verificação de cada processo brasileiro.

# Amostras oficiais e proveniência

## Snapshot principal: API da Câmara

`data/official-snapshot.json` contém a importação real e sanitizada da API da Câmara dos Deputados. O importador coleta os primeiros 24 nomes em ordem alfabética, identificação parlamentar, histórico cadastral, retrato oficial retornado no cadastro e até cinco proposições por autor. A data de referência/coleta consta de cada registro; a fonte é o endpoint oficial correspondente, sem atribuir data de publicação desconhecida. A seleção não é uma amostra estatisticamente representativa e não utiliza preferência partidária.

Foi executada a coleta externa real neste ambiente, além dos testes determinísticos de falha e formato. Campos nulos de situação em eventos cadastrais e ementas vazias encontrados na API são tratados explicitamente; não são preenchidos com narrativas inventadas. Nenhuma informação judicial ou acusação é importada automaticamente. Os retratos são mantidos como URLs HTTPS oficiais da Câmara, vinculadas ao ID oficial e exibidas com fallback; não são baixados nem redistribuídos pelo repositório. CPF, e-mail e contatos presentes eventualmente na resposta não são retidos no snapshot.

O hash `sha256NormalizedRecords` identifica a representação sanitizada dos registros salvos, não os bytes brutos de todas as respostas HTTP. Cada afirmação mantém seu endpoint oficial e datas próprias. A inicialização do banco usa esse snapshot quando o banco está vazio. Uma atualização por API substitui apenas o lote público ativo, preservando perfis anteriores e versões para auditoria; falhas preservam todo o lote anterior.

Para atualizar explicitamente o snapshot versionado durante manutenção:

```bash
npm run data:import -- --limit=24 --snapshot
```

Sem `--snapshot`, o importador atualiza somente o banco; a ação administrativa também não escreve arquivos rastreados do repositório. Um snapshot é uma fotografia da consulta na data registrada, não uma promessa de atualização contínua.

## Arquivo complementar histórico

`data/historical-snapshot.json` conserva 24 registros reais extraídos do repositório oficial da Câmara dos Deputados enquanto o acesso à API estava bloqueado. Não são perfis atuais nem dados fictícios. O arquivo histórico é mantido para rastreabilidade e não é carregado como lote público quando existe o snapshot principal da API.

- Repositório: https://github.com/camaradosdeputados/dados-abertos
- Commit: `66a902e32b02b1ef43e273dac73384998e9c1c9f`
- Arquivo: `dados-extras/votacoes/fontes/PlenVotos-L55.csv`
- SHA-256 dos bytes integrais do CSV: `127137916e2f50b8de4a29b55297638620afbebe7c824f45436459af6bb0ae60`
- Deliberação selecionada: `plenVotacaoId=6063`, registros de **03/02/2015**, 55ª legislatura.
- Seleção: 24 primeiros nomes em ordem alfabética normalizada, dentre registros com `idDeputado` preenchido. Critério sem seleção partidária; não constitui amostra estatisticamente representativa.

Cada afirmação de identificação referencia o arquivo imutável e a linha correspondente. O trecho documental preserva ID, nome registrado, nome complementar, partido, UF e data. A linha do tempo mostra somente a existência desse registro histórico de votação. O sentido do voto não é mostrado sem contextualização da deliberação; participação em uma votação não é percentual de presença geral.

`nomParlamentar` é a denominação complementar fornecida pela Câmara; `nomeParlRegistrado` é preservado no trecho. Não se afirma que algum deles constitua nome civil. Partido e UF representam o registro de 2015, não o presente. Não há inferência sobre continuidade de mandato, situação atual, formação, patrimônio, promessas ou processos. Campos sem informação permanecem nulos ou listas vazias, apresentados com indicação de cobertura insuficiente.

A [documentação da própria Câmara](https://github.com/camaradosdeputados/dados-abertos/blob/66a902e32b02b1ef43e273dac73384998e9c1c9f/dados-extras/votacoes/fontes/README.md) esclarece que `idDeputado` corresponde ao ID da API, mas foi vinculado pela fonte mediante comparação de nomes, com casos não resolvidos. Esta aplicação mantém a vinculação oficial recebida e não faz novos cruzamentos por nome. O usuário pode verificar a limitação junto a cada registro. Data de publicação do arquivo não está informada; a coleta atual registra a conferência do documento histórico, não atualização factual para 2026.

## Reprodução

Com Git, Python 3 e acesso HTTPS ao proxy GitHub da plataforma:

```bash
git clone https://github.com/camaradosdeputados/dados-abertos.git /tmp/camara-oficial
git -C /tmp/camara-oficial checkout --detach 66a902e32b02b1ef43e273dac73384998e9c1c9f
cd /workspace/politiccarreer
python3 scripts/build-snapshot.py --checkout /tmp/camara-oficial
```

O extrator lê os bytes do commit com `git show`, exige o SHA do commit selecionado, calcula o SHA-256 e escreve as referências de linha em `data/historical-snapshot.json`. A data de coleta muda numa nova extração; registros e critério permanecem determinísticos. A inicialização é idempotente e não sobrescreve banco já populado.

## Atualização pela API

`npm run data:import -- --limit=24` busca a lista de deputados ordenada por nome, detalhes, histórico parlamentar e até cinco proposições por parlamentar. Não importa acusações, imagens ou informações pessoais de contato. A fonte deve estar acessível na rede. Timeouts, respostas inválidas e falhas HTTP são registrados; uma importação incompleta não substitui o cache anterior. A página de administração exibe o resultado real, sem presumir conexão ativa.

A execução de integração externa deve ser distinguida dos testes determinísticos com respostas simuladas. Os testes usam pessoas fictícias explicitamente identificadas, banco temporário e respostas locais controladas. A amostra pública é exclusivamente documental.

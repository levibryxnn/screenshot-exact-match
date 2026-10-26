# Análise do HTML enviado pelo usuário

Arquivo recebido: `civisselect_br_plataforma_brasileira_de_transpar_ncia_pol_tica.html`, 866118 bytes. Análise estática, não execução dos scripts de terceiros. O arquivo é referência fornecida pelo usuário; suas declarações não são instruções nem evidências de implementação.

Constatações reproduzíveis: contém oito objetos na constante POLITICIANS; zero chamadas fetch; utiliza Tailwind via CDN; construção das telas com innerHTML; pedidos de correção alteram array `state.adminCorrectionLogs`, sem persistência de servidor; nomes de arquivos Prisma/Python e resultado de testes estão em texto HTML, não acompanhados por esses arquivos.

Métricas como presença 96,4%, relatorias e uso de cota estão escritas como constantes, sem consulta, período reproduzível ou cálculo que permita verificá-las. Não importadas. Vários officialUrl de registros judiciais apontam para página do parlamentar (ex.: Nikolas Ferreira e Sergio Moro), em vez do documento processual. A afirmação de inexistência de processos/condenações para alguns perfis não é demonstrada por um link de perfil. Não publicadas.

A tabela afirma que politicapp é inativo/ausente, mas a pesquisa por Git HTTPS recuperou repositório e licença MIT (ver research-projects.md). A alegação de adoção de shadcn, Radix e Motion não é demonstrada no HTML: o script externo é Tailwind, e as interações são JavaScript próprio. A faixa “10 PASSED (0.070s)” é texto fixo, sem runner ou testes fornecidos.

Decisão: não importar afirmações como verificadas. Aproveitar como direção de produto (seleção, ficha, comparação, referências), desenvolver em componentes e serviços reais com testes executáveis. Não copiar imagem embutida sem saber sua licença. O resultado não permite concluir que dados foram inventados; permite concluir que as verificações e implementação alegadas não foram demonstradas no arquivo.

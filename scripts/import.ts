import { importCamara } from '../src/lib/camara';
import { initDatabase, closeDatabase, listPoliticians } from '../src/lib/db';
import { createHash } from 'node:crypto';
import { writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
try {
  const raw=process.argv.find(arg=>arg.startsWith('--limit='));
  const limit=raw ? Number(raw.split('=')[1]) : 24;
  initDatabase();
  const result=await importCamara(limit);
  console.log(`Importação ${result.runId}: ${result.count} registros oficiais persistidos.`);
  if(process.argv.includes('--snapshot')) {
    const politicians=listPoliticians({pageSize:100}).items;
    const target=resolve(process.cwd(),'data/official-snapshot.json');
    const historical=resolve(process.cwd(),'data/historical-snapshot.json');
    if(existsSync(target) && !existsSync(historical)) copyFileSync(target,historical);
    const snapshot={metadata:{
      source:'Câmara dos Deputados — API Dados Abertos v2',
      collectionUrl:`https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=${limit}&pagina=1`,
      collectedAt:politicians[0]?.collectedAt||new Date().toISOString(),
      runId:result.runId,count:politicians.length,coverage:'live',
      sha256NormalizedRecords:createHash('sha256').update(JSON.stringify(politicians)).digest('hex'),
      selection:`Primeiros ${limit} nomes em ordem alfabética na lista de deputados da API. Sem seleção partidária, sem pretensão de representatividade estatística.`,
      limitations:[
        'Snapshot de consulta oficial com data definida; não representa atualização contínua.',
        'Até 5 proposições recentes por vínculo de autoria. Não constitui total de produção nem prova de implementação.',
        'Histórico parlamentar cadastral não constitui histórico eleitoral completo.',
        'Não foram importados dados judiciais, patrimônio, promessas ou contatos pessoais. Retratos são URLs oficiais validadas e exibidas por proxy, sem cópia local.',
        'A fonte pode informar campos ausentes; estes permanecem nulos ou são identificados explicitamente.',
      ],
    },politicians};
    writeFileSync(target,JSON.stringify(snapshot,null,2)+'\n');
    console.log(`Snapshot sanitizado salvo em data/official-snapshot.json (${politicians.length} registros).`);
  }
} catch(error) {
  console.error(error instanceof Error ? error.message : 'Falha na importação.');
  process.exitCode=1;
} finally { closeDatabase(); }

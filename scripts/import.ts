import { importCamara } from '../src/lib/camara';
import { importSenado } from '../src/lib/senado';
import { initDatabase, closeDatabase, listAllPoliticians } from '../src/lib/db';
import { createHash } from 'node:crypto';
import { writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const arg = (prefix: string) => process.argv.find(value => value.startsWith(prefix))?.split('=')[1];
const source = arg('--source=') ?? 'camara';
const requestedLimit = arg('--limit=') ? Number(arg('--limit=')) : undefined;
const snapshotRequested = process.argv.includes('--snapshot');

function recordsFor(prefix: 'camara' | 'senado') {
  return listAllPoliticians().filter(record => record.id.startsWith(`${prefix}:`));
}

function writeSnapshot(prefix: 'camara' | 'senado', result: { runId: string }, limit: number) {
  const politicians = recordsFor(prefix);
  const target = resolve(process.cwd(), `data/${prefix === 'camara' ? 'official' : 'senado'}-snapshot.json`);
  const snapshot = prefix === 'camara' ? {
    metadata: {
      source: 'Câmara dos Deputados — API Dados Abertos v2',
      collectionUrl: `https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=${limit}&pagina=1`,
      collectedAt: politicians[0]?.collectedAt || new Date().toISOString(), runId: result.runId, count: politicians.length, coverage: 'live',
      sha256NormalizedRecords: createHash('sha256').update(JSON.stringify(politicians)).digest('hex'),
      selection: `Primeiros ${limit} nomes em ordem alfabética na lista de deputados da API. Sem seleção partidária, sem pretensão de representatividade estatística.`,
      limitations: ['Snapshot de consulta oficial com data definida; não representa atualização contínua.', 'Até 5 proposições recentes por vínculo de autoria. Não constitui total de produção nem prova de implementação.', 'Histórico parlamentar cadastral não constitui histórico eleitoral completo.', 'Não foram importados dados judiciais, patrimônio, promessas ou contatos pessoais. Retratos são URLs oficiais validadas e exibidas por proxy, sem cópia local.', 'A fonte pode informar campos ausentes; estes permanecem nulos ou são identificados explicitamente.'],
    }, politicians,
  } : {
    metadata: {
      source: 'Senado Federal — Dados Abertos', collectionUrl: 'https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json',
      collectedAt: politicians[0]?.collectedAt || new Date().toISOString(), runId: result.runId, count: politicians.length, coverage: 'live',
      sha256NormalizedRecords: createHash('sha256').update(JSON.stringify(politicians)).digest('hex'),
      selection: 'Lista completa de parlamentares em exercício retornada pelo serviço oficial do Senado.',
      limitations: ['Lista corrente de exercício; não constitui histórico eleitoral completo.', 'Proposições, votações, suplência e afastamentos detalhados ainda não foram importados.', 'Fotos HTTP retornadas pelo serviço não são convertidas para HTTPS sem validação do endpoint oficial.'],
    }, politicians,
  };
  if (prefix === 'camara') {
    const historical = resolve(process.cwd(), 'data/historical-snapshot.json');
    if (existsSync(target) && !existsSync(historical)) copyFileSync(target, historical);
  }
  writeFileSync(target, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Snapshot sanitizado salvo em ${target} (${politicians.length} registros).`);
}

try {
  if (!['camara', 'senado', 'all'].includes(source)) throw new Error('Use --source=camara, --source=senado ou --source=all.');
  initDatabase();
  if (source === 'camara' || source === 'all') {
    const limit = requestedLimit ?? 513;
    const result = await importCamara(limit);
    console.log(`Importação Câmara ${result.runId}: ${result.count} registros oficiais persistidos.`);
    if (snapshotRequested) writeSnapshot('camara', result, limit);
  }
  if (source === 'senado' || source === 'all') {
    const limit = Math.min(requestedLimit ?? 81, 100);
    const result = await importSenado(limit);
    console.log(`Importação Senado ${result.runId}: ${result.count} registros oficiais persistidos.`);
    if (snapshotRequested) writeSnapshot('senado', result, limit);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha na importação.');
  process.exitCode = 1;
} finally { closeDatabase(); }

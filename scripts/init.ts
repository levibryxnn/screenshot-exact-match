import { initDatabase, getDataStatus, closeDatabase } from '../src/lib/db';
try {
  initDatabase();
  const status=getDataStatus();
  console.log(`Banco inicializado: ${status.count} registros. Cobertura: ${status.coverage}.`);
  if(!status.count) console.log('Sem amostra oficial disponível. Execute npm run data:import com acesso à API da Câmara.');
} catch(error) {
  console.error(error instanceof Error ? error.message : 'Falha na inicialização.');
  process.exitCode=1;
} finally { closeDatabase(); }

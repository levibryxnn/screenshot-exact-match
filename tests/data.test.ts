import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import type { Politician, LegalRecord, Citation } from '../src/lib/types';
import { closeDatabase, savePoliticians, listPoliticians, getPolitician, getDb, submitCorrection, listCorrections, getImportRuns, getDataStatus } from '../src/lib/db';
import { validatePoliticians, legalRecordSchema, legalStatuses, citationSchema } from '../src/lib/validation';
import { assertCamaraUrl, fetchCamaraJson, importCamara, collectCamara } from '../src/lib/camara';

// All entities created in this file are explicitly fictitious test fixtures.
const now=new Date().toISOString();
const source:Citation={id:'test-source',publisher:'Câmara dos Deputados',title:'Fonte fictícia para teste de contrato, não publicada',url:'https://dadosabertos.camara.leg.br/api/v2/deputados/999999',documentId:'test-only-999999',eventDate:null,publishedAt:null,collectedAt:now,verifiedAt:now,excerpt:null,kind:'primary',verification:'official-import'};
function fixture(id=999999,name='Pessoa fictícia Ágata'):Politician {
  return {id:`camara:${id}`,officialId:id,name,fullName:null,party:'TESTE',uf:'SP',role:'Deputado(a) federal',municipality:null,status:'Fixture de teste',legislature:57,photoUrl:null,referenceDate:now.slice(0,10),collectedAt:now,coverage:'live',education:null,source,timeline:[],proposals:[],legalRecords:[]};
}
function legalFixture(status:LegalRecord['status']='investigation'):LegalRecord {
  const reviewedSource:Citation={...source,url:'https://www.stf.jus.br/portal/processo/verProcessoAndamento.asp?incidente=999999',documentId:'documento-ficticio-test-only',verification:'reviewed'};
  return {id:'test-legal',title:'Procedimento fictício usado apenas em testes',nature:'criminal',status,summary:'Registro fictício para testar estados e controles de publicação documental.',body:'Órgão fictício',caseNumber:'TESTE-000',individualInvolvement:'Envolvimento fictício, fixture de teste.',defense:null,verifiedAt:now,reviewer:'Revisor fictício',reviewReason:'Validação fictícia do contrato de testes.',source:reviewedSource,history:[{date:now,status,description:'Evento fictício usado em teste unitário.',source:reviewedSource}]};
}
let directory:string;
before(()=>{directory=mkdtempSync(join(tmpdir(),'civis-data-test-'));process.env.CIVIS_DB_PATH=join(directory,'test.db');process.env.CIVIS_SKIP_SNAPSHOT='1';});
after(()=>{closeDatabase();rmSync(directory,{recursive:true,force:true});delete process.env.CIVIS_DB_PATH;delete process.env.CIVIS_SKIP_SNAPSHOT;});

test('IDs oficiais devem corresponder ao ID interno, nunca ao nome',()=>{
  assert.throws(()=>validatePoliticians([{...fixture(),id:'camara:123'}]));
  const records=validatePoliticians([fixture(999999,'Nome igual fictício'),fixture(999998,'Nome igual fictício')]);
  assert.equal(records.length,2);
});
test('duplicação e datas impossíveis são rejeitadas antes de persistir',()=>{
  assert.throws(()=>savePoliticians([fixture(),fixture()]));
  assert.throws(()=>validatePoliticians([{...fixture(),referenceDate:'2026-02-31'}]));
  assert.equal(listPoliticians().total,0);
});
test('persistência, pesquisa sem acentos, filtros e paginação com parâmetros SQL',()=>{
  savePoliticians([fixture(),fixture(999998,'Pessoa fictícia Beta')]);
  assert.equal(listPoliticians({q:'agata',uf:'SP',party:'TESTE'}).items[0].officialId,999999);
  assert.equal(listPoliticians({uf:'RJ'}).total,0);
  assert.equal(listPoliticians({q:"' OR 1=1 --"}).total,0);
  assert.equal(listPoliticians({q:'%'}).total,0);
  const page=listPoliticians({page:2,pageSize:1});assert.equal(page.total,2);assert.equal(page.items.length,1);
});
test('atualizações preservam versões auditáveis e não duplicam registros',()=>{
  savePoliticians([{...fixture(),party:'TESTE2'}]);
  assert.equal(getPolitician('camara:999999')?.party,'TESTE2');
  assert.equal(listPoliticians().total,2);
  assert.equal(Number((getDb().prepare('SELECT count(*) AS c FROM politician_versions WHERE politician_id=?').get('camara:999999') as {c:number}).c),2);
});
test('fonte não oficial não recebe selo de importação oficial',()=>{
  assert.throws(()=>citationSchema.parse({...source,url:'https://example.com/noticia'}));
  assert.throws(()=>citationSchema.parse({...source,url:'https://user:password@dadosabertos.camara.leg.br/api/v2/deputados/1'}));
});
test('todos os dez estados jurídicos são distintos e representáveis',()=>{
  assert.equal(new Set(legalStatuses).size,10);
  for(const status of legalStatuses) assert.equal(legalRecordSchema.parse(legalFixture(status)).status,status);
});
test('investigação não pode ser publicada como condenação ou crime comprovado',()=>{
  assert.throws(()=>legalRecordSchema.parse({...legalFixture(),summary:'Pessoa fictícia condenada por crime comprovado no procedimento.'}));
  assert.throws(()=>legalRecordSchema.parse({...legalFixture('appealable-conviction'),summary:'Condenação definitiva transitada em julgado da pessoa fictícia.'}));
  assert.throws(()=>legalRecordSchema.parse({...legalFixture('final-conviction'),nature:'civil',summary:'Condenação criminal em processo fictício de natureza civil.'}));
});
test('publicação sensível exige revisão humana, documento específico e estado atualizado',()=>{
  assert.throws(()=>legalRecordSchema.parse({...legalFixture(),reviewer:''}));
  assert.throws(()=>legalRecordSchema.parse({...legalFixture(),source:{...source,verification:'official-import'}}));
  assert.throws(()=>legalRecordSchema.parse({...legalFixture(),source:{...source,verification:'reviewed'}}));
  assert.throws(()=>legalRecordSchema.parse({...legalFixture('dismissed'),history:legalFixture('investigation').history}));
  assert.throws(()=>legalRecordSchema.parse({...legalFixture(),verifiedAt:'2020-01-01'}));
});
test('pedidos de correção persistem e exigem vínculo, texto e HTTPS',()=>{
  const result=submitCorrection({politicianId:'camara:999999',subject:'Pedido fictício de revisão documental para teste.',evidenceUrl:'https://www.camara.leg.br/documento-test-only'});
  assert.equal(result.status,'pending');assert.equal(listCorrections().length,1);
  assert.throws(()=>submitCorrection({politicianId:'camara:123',subject:'Pedido fictício de revisão documental.',evidenceUrl:'https://www.camara.leg.br/test'}));
  assert.throws(()=>submitCorrection({politicianId:'camara:999999',subject:'Pedido fictício de revisão documental.',evidenceUrl:'javascript:alert(1)'}));
});
test('conector rejeita destinos externos, credenciais e caminhos fora da API',()=>{
  for(const url of ['http://dadosabertos.camara.leg.br/api/v2/deputados','https://127.0.0.1/api/v2/deputados','https://dadosabertos.camara.leg.br.evil.example/api/v2/deputados','https://dadosabertos.camara.leg.br:8443/api/v2/deputados','https://dadosabertos.camara.leg.br/private']) assert.throws(()=>assertCamaraUrl(url));
});
test('conector repete falha transitória, respeita erro permanente e proíbe redirects',async()=>{
  let attempts=0;
  const fetcher:typeof fetch=async(_input,init)=>{assert.equal(init?.redirect,'error');attempts++;return attempts===1 ? new Response('',{status:503}):Response.json({dados:[{id:1}],links:[]});};
  const response=await fetchCamaraJson('https://dadosabertos.camara.leg.br/api/v2/deputados',{fetcher,retries:1});
  assert.equal(attempts,2);assert.deepEqual(response.dados,[{id:1}]);
  attempts=0;
  await assert.rejects(()=>fetchCamaraJson('https://dadosabertos.camara.leg.br/api/v2/deputados',{fetcher:async()=>{attempts++;return new Response('',{status:403});},retries:2}));
  assert.equal(attempts,1);
});
test('falha de integração é auditada e preserva cache anterior',async()=>{
  const beforeCount=listPoliticians().total;
  await assert.rejects(()=>importCamara(2,{fetcher:async()=>new Response('',{status:403}),retries:0}));
  assert.equal(listPoliticians().total,beforeCount);assert.equal(getImportRuns()[0].status,'failed');
  assert.match(getImportRuns()[0].message,/Cache anterior preservado/);assert.equal(getDataStatus().lastRun?.status,'failed');
});
test('resposta vazia ou IDs divergentes nunca substituem dados anteriores',async()=>{
  await assert.rejects(()=>collectCamara(1,{fetcher:async()=>Response.json({dados:[],links:[]}),retries:0}),/zero deputados/);
  await assert.rejects(()=>collectCamara(1,{fetcher:async input=>String(input).includes('?')?Response.json({dados:[{id:1,nome:'Pessoa fictícia',siglaPartido:'TESTE',siglaUf:'SP'}]}):Response.json({dados:{id:2,ultimoStatus:{nome:'Outra pessoa fictícia',siglaPartido:'TESTE',siglaUf:'SP',idLegislatura:57}}}),retries:0}),/ID divergente/);
});
test('integração normaliza campos ausentes reais sem inventar ementa e descarta contatos',async()=>{
  const fetcher:typeof fetch=async input=>{
    const url=String(input);
    if(url.includes('/historico')) return Response.json({dados:[{dataHora:'2023-02-01T10:00:00',situacao:null,descricaoStatus:null,siglaPartido:null,siglaUf:null}]});
    if(url.includes('/proposicoes?')) return Response.json({dados:[{id:123,siglaTipo:'REQ',numero:1,ano:2026,ementa:''}]});
    if(url.includes('/deputados?')) return Response.json({dados:[{id:1,nome:'Pessoa fictícia',siglaPartido:'TESTE',siglaUf:'SP'}],links:[]});
    return Response.json({dados:{id:1,nomeCivil:'Pessoa fictícia teste',escolaridade:null,cpf:'DADO-TESTE-NAO-PUBLICAR',email:'privado@example.test',ultimoStatus:{nome:'Pessoa fictícia',siglaPartido:'TESTE',siglaUf:'SP',idLegislatura:57,situacao:'Exercício'}}});
  };
  const records=await collectCamara(1,{fetcher,retries:0});
  assert.equal(records[0].proposals[0].title,'Ementa não informada pela fonte');
  assert.equal(records[0].timeline[0].title,'Atualização cadastral');
  assert.equal(records[0].photoUrl,null);
  assert.ok(!JSON.stringify(records).includes('NAO-PUBLICAR'));
  assert.ok(!JSON.stringify(records).includes('privado@example.test'));
  assert.equal(validatePoliticians(records).length,1);
});
test('novo lote ativo preserva perfis e versões anteriores sem misturar amostras',()=>{
  savePoliticians([fixture(999997,'Nova pessoa fictícia')],{replaceActive:true});
  assert.equal(listPoliticians().total,1);assert.equal(listPoliticians().items[0].officialId,999997);
  assert.ok(getPolitician('camara:999999'));assert.equal(getDataStatus().count,1);
});
test('snapshot distribuído contém registros documentados válidos, quando presente',()=>{
  const path=join(process.cwd(),'data/official-snapshot.json');
  assert.ok(existsSync(path),'Snapshot oficial necessário para demonstrar a aplicação com dados reais.');
  const snapshot=JSON.parse(readFileSync(path,'utf8'));
  const records=validatePoliticians(snapshot.politicians);
  assert.ok(records.length>=2);assert.ok(records.every(record=>record.source.verification==='official-import'));
  assert.ok(records.every(record=>record.legalRecords.length===0),'Não importar acusações automaticamente.');
});

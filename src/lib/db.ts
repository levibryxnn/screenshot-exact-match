import { DatabaseSync } from 'node:sqlite';
import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Politician, ImportRun, Correction, DataStatus } from './types';
import { validatePoliticians, correctionSchema } from './validation';

let singleton: DatabaseSync | undefined;
let currentPath: string | undefined;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function getDb(): DatabaseSync {
  const path = process.env.CIVIS_DB_PATH || resolve(process.cwd(), 'var/civis.db');
  if (singleton && currentPath === path) return singleton;
  singleton?.close();
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive:true });
  singleton = new DatabaseSync(path);
  currentPath = path;
  singleton.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS politicians (
      id TEXT PRIMARY KEY, official_id INTEGER NOT NULL UNIQUE, name TEXT NOT NULL, search_name TEXT NOT NULL,
      party TEXT NOT NULL, uf TEXT NOT NULL, role TEXT NOT NULL, status TEXT NOT NULL, coverage TEXT NOT NULL,
      collected_at TEXT NOT NULL, reference_date TEXT, active INTEGER NOT NULL DEFAULT 1, data TEXT NOT NULL CHECK(json_valid(data))
    );
    CREATE INDEX IF NOT EXISTS politicians_filters ON politicians(party,uf,role);
    CREATE TABLE IF NOT EXISTS politician_versions (
      id TEXT PRIMARY KEY, politician_id TEXT NOT NULL, collected_at TEXT NOT NULL,
      checksum TEXT NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)), UNIQUE(politician_id,checksum)
    );
    CREATE TABLE IF NOT EXISTS import_runs (
      id TEXT PRIMARY KEY, started_at TEXT NOT NULL, completed_at TEXT, status TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0, message TEXT NOT NULL, source TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS corrections (
      id TEXT PRIMARY KEY, politician_id TEXT NOT NULL REFERENCES politicians(id), subject TEXT NOT NULL,
      evidence_url TEXT NOT NULL, submitted_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending'
    );`);
  const columns=singleton.prepare('PRAGMA table_info(politicians)').all() as {name:string}[];
  if(!columns.some(column=>column.name==='active')) singleton.exec('ALTER TABLE politicians ADD COLUMN active INTEGER NOT NULL DEFAULT 1');
  return singleton;
}

export function closeDatabase() { singleton?.close(); singleton=undefined; currentPath=undefined; }
export function beginImport(source:string):string {
  const id=randomUUID();
  getDb().prepare('INSERT INTO import_runs(id,started_at,status,message,source) VALUES (?,?,?,?,?)').run(id,new Date().toISOString(),'running','Importação iniciada.',source);
  return id;
}
export function finishImport(id:string, status:'success'|'failed', count:number, message:string) {
  getDb().prepare('UPDATE import_runs SET completed_at=?,status=?,count=?,message=? WHERE id=?').run(new Date().toISOString(),status,count,message.slice(0,2000),id);
}

export function savePoliticians(input:unknown, options:{replaceActive?:boolean; activePrefix?:'camara'|'senado'}={}):number {
  const records=validatePoliticians(input);
  const db=getDb();
  const upsert=db.prepare(`INSERT INTO politicians(id,official_id,name,search_name,party,uf,role,status,coverage,collected_at,reference_date,data)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
    official_id=excluded.official_id,name=excluded.name,search_name=excluded.search_name,party=excluded.party,uf=excluded.uf,
    role=excluded.role,status=excluded.status,coverage=excluded.coverage,collected_at=excluded.collected_at,reference_date=excluded.reference_date,active=1,data=excluded.data`);
  db.exec('BEGIN IMMEDIATE');
  try {
    if(options.replaceActive) {
      if (options.activePrefix) db.prepare('UPDATE politicians SET active=0 WHERE id LIKE ?').run(`${options.activePrefix}:%`);
      else db.prepare('UPDATE politicians SET active=0').run();
    }
    for(const record of records) {
      const data=JSON.stringify(record);
      upsert.run(record.id,record.officialId,record.name,normalize(record.name),record.party,record.uf,record.role,record.status,record.coverage,record.collectedAt,record.referenceDate,data);
      db.prepare('INSERT OR IGNORE INTO politician_versions(id,politician_id,collected_at,checksum,data) VALUES(?,?,?,?,?)').run(randomUUID(),record.id,record.collectedAt,createHash('sha256').update(data).digest('hex'),data);
    }
    db.exec('COMMIT');
  } catch(error) { db.exec('ROLLBACK'); throw error; }
  return records.length;
}

export function initDatabase() {
  const db=getDb();
  if(process.env.CIVIS_SKIP_SNAPSHOT === '1') return;
  if((db.prepare('SELECT count(*) AS count FROM politicians').get() as {count:number}).count) return;
  const snapshots=[
    {path:resolve(process.cwd(),'data/official-snapshot.json'),source:'Câmara dos Deputados — snapshot oficial versionado',message:'Snapshot da Câmara importado. Datas de referência preservadas; a coleta não implica atualização contínua.'},
    {path:resolve(process.cwd(),'data/senado-snapshot.json'),source:'Senado Federal — snapshot oficial versionado',message:'Snapshot do Senado importado. A lista corrente não substitui histórico eleitoral completo.'},
  ];
  for(const entry of snapshots){
    if(!existsSync(/* turbopackIgnore: true */ entry.path)) continue;
    const snapshot=JSON.parse(readFileSync(/* turbopackIgnore: true */ entry.path,'utf8')) as {politicians:unknown};
    const run=beginImport(entry.source);
    try {
      const count=savePoliticians(snapshot.politicians);
      finishImport(run,'success',count,entry.message);
    } catch(error) {
      finishImport(run,'failed',0,error instanceof Error ? error.message : 'Snapshot inválido.');
      throw error;
    }
  }
}

export interface PoliticianFilters { q?:string; party?:string; uf?:string; role?:string; status?:string; page?:number; pageSize?:number }
export function listPoliticians(filters:PoliticianFilters={}) {
  initDatabase();
  const page=Number.isFinite(filters.page) ? Math.max(1,Math.min(100000,Math.floor(filters.page!))) : 1;
  const pageSize=Number.isFinite(filters.pageSize) ? Math.max(1,Math.min(100,Math.floor(filters.pageSize!))) : 24;
  const conditions:string[]=['active=1']; const args:(string|number)[]=[];
  if(filters.q) { conditions.push("search_name LIKE ? ESCAPE '\\'"); args.push(`%${normalize(filters.q.slice(0,200)).replace(/[\\%_]/g,'\\$&')}%`); }
  for(const key of ['party','uf','role','status'] as const) if(filters[key]) {conditions.push(`${key}=?`); args.push(filters[key]!);}
  const where=conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const total=(getDb().prepare(`SELECT count(*) AS count FROM politicians ${where}`).get(...args) as {count:number}).count;
  const rows=getDb().prepare(`SELECT data FROM politicians ${where} ORDER BY search_name ASC,id ASC LIMIT ? OFFSET ?`).all(...args,pageSize,(page-1)*pageSize) as unknown as {data:string}[];
  return {items:rows.map(row=>JSON.parse(row.data) as Politician),total,page,pageSize};
}
export function listAllPoliticians() {
  const first = listPoliticians({ page: 1, pageSize: 100 });
  const items = [...first.items];
  for (let page = 2; items.length < first.total; page++) items.push(...listPoliticians({ page, pageSize: 100 }).items);
  return items;
}
/** Small public-card payload; detail records remain available on the profile route. */
export function listAllPoliticianSummaries() {
  return listAllPoliticians().map(record => ({
    ...record,
    education: null,
    timeline: [],
    proposals: [],
    legalRecords: [],
  } satisfies Politician));
}
export function getPolitician(id:string):Politician|null {
  initDatabase();
  const row=getDb().prepare('SELECT data FROM politicians WHERE id=?').get(id) as {data:string}|undefined;
  return row ? JSON.parse(row.data) as Politician : null;
}
function mapRun(row:Record<string,unknown>):ImportRun {
  return {id:String(row.id),startedAt:String(row.started_at),completedAt:row.completed_at ? String(row.completed_at):null,status:row.status as ImportRun['status'],count:Number(row.count),message:String(row.message),source:String(row.source)};
}
export function getImportRuns():ImportRun[] {
  initDatabase();
  return (getDb().prepare('SELECT * FROM import_runs ORDER BY started_at DESC,rowid DESC LIMIT 50').all() as Record<string,unknown>[]).map(mapRun);
}
export function getDataStatus():DataStatus {
  initDatabase();
  const count=Number((getDb().prepare('SELECT count(*) AS count FROM politicians WHERE active=1').get() as {count:number}).count);
  const success=getDb().prepare("SELECT completed_at FROM import_runs WHERE status='success' ORDER BY completed_at DESC LIMIT 1").get() as {completed_at:string}|undefined;
  const historical=Number((getDb().prepare("SELECT count(*) AS count FROM politicians WHERE active=1 AND coverage='historical'").get() as {count:number}).count);
  const minDate=getDb().prepare('SELECT min(reference_date) AS date FROM politicians WHERE active=1').get() as {date:string|null};
  return {count,lastSuccess:success?.completed_at||null,lastRun:getImportRuns()[0]||null,stale:historical>0||!minDate.date||Date.now()-Date.parse(minDate.date)>7*86400000,coverage:historical === count && count>0 ? 'historical' : historical>0 ? 'mixed' : count>0 ? 'live' : 'empty'};
}
export function submitCorrection(input:unknown):Correction {
  const parsed=correctionSchema.parse(input);
  if(!getPolitician(parsed.politicianId)) throw new Error('Parlamentar não encontrado.');
  const result:Correction={id:randomUUID(),...parsed,submittedAt:new Date().toISOString(),status:'pending'};
  getDb().prepare('INSERT INTO corrections(id,politician_id,subject,evidence_url,submitted_at,status) VALUES(?,?,?,?,?,?)').run(result.id,result.politicianId,result.subject,result.evidenceUrl,result.submittedAt,result.status);
  return result;
}
export function listCorrections():Correction[] {
  initDatabase();
  return (getDb().prepare('SELECT * FROM corrections ORDER BY submitted_at DESC LIMIT 100').all() as Record<string,unknown>[]).map(row=>({id:String(row.id),politicianId:String(row.politician_id),subject:String(row.subject),evidenceUrl:String(row.evidence_url),submittedAt:String(row.submitted_at),status:String(row.status)}));
}

import { z } from 'zod';
import * as http from 'node:http';
import type { Citation, Politician, Proposal, TimelineEvent } from './types';
import { beginImport, finishImport, savePoliticians } from './db';

// Respect the platform's injected HTTPS proxy; never bypass its access policy.
const httpWithProxy = http as unknown as {setGlobalProxyFromEnv?: (env:NodeJS.ProcessEnv)=>()=>void};
if(process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy) httpWithProxy.setGlobalProxyFromEnv?.(process.env);

const API='https://dadosabertos.camara.leg.br/api/v2';
const linkSchema=z.object({rel:z.string(),href:z.string().url()});
const envelopeSchema=z.object({dados:z.unknown(),links:z.array(linkSchema).optional()});
const deputySchema=z.object({id:z.number().int().positive(),nome:z.string().min(1),siglaPartido:z.string().min(1),siglaUf:z.string().regex(/^[A-Z]{2}$/),idLegislatura:z.number().int().positive().optional()});
const deputyDetailSchema=z.object({id:z.number().int().positive(),nomeCivil:z.string().nullable().optional(),escolaridade:z.string().nullable().optional(),ultimoStatus:z.object({nome:z.string(),siglaPartido:z.string(),siglaUf:z.string(),idLegislatura:z.number().int().positive(),situacao:z.string().nullable().optional(),data:z.string().optional()})});
const proposalRawSchema=z.object({id:z.number().int().positive(),siglaTipo:z.string(),numero:z.number(),ano:z.number(),ementa:z.string().nullable().optional()});
const historyRawSchema=z.object({dataHora:z.string(),situacao:z.string().nullable().optional(),nome:z.string().nullable().optional(),siglaPartido:z.string().nullable().optional(),siglaUf:z.string().nullable().optional(),descricaoStatus:z.string().nullable().optional()});
export interface CamaraFetchOptions { fetcher?:typeof fetch; timeoutMs?:number; retries?:number }

export function assertCamaraUrl(input:string):URL {
  const url=new URL(input);
  if(url.protocol!=='https:' || url.hostname!=='dadosabertos.camara.leg.br' || url.port || url.username || url.password || !url.pathname.startsWith('/api/v2/')) throw new Error('Destino de integração não autorizado.');
  return url;
}
export async function fetchCamaraJson(url:string, options:CamaraFetchOptions={}) {
  assertCamaraUrl(url);
  const retries=options.retries??2;
  let last:unknown;
  for(let attempt=0;attempt<=retries;attempt++) {
    try {
      const response=await (options.fetcher??fetch)(url,{headers:{Accept:'application/json','User-Agent':'CivisBR/0.1 (+official-public-data)'},redirect:'error',signal:AbortSignal.timeout(options.timeoutMs??15000)});
      if(!response.ok) {
        const error=new Error(`Fonte Câmara respondeu HTTP ${response.status}.`);
        if(response.status!==429 && response.status<500) throw Object.assign(error,{permanent:true});
        throw error;
      }
      const contentLength=Number(response.headers.get('content-length')||0);
      if(contentLength>5_000_000) throw Object.assign(new Error('Resposta da fonte excedeu o limite de segurança.'),{permanent:true});
      const body=await response.text();
      if(body.length>5_000_000) throw Object.assign(new Error('Resposta da fonte excedeu o limite de segurança.'),{permanent:true});
      return envelopeSchema.parse(JSON.parse(body));
    } catch(error) {
      last=error;
      if((error as {permanent?:boolean}).permanent || attempt===retries) throw error;
      await new Promise(resolve=>setTimeout(resolve,Math.min(3000,300*2**attempt)));
    }
  }
  throw last;
}
function citation(id:string,title:string,url:string,collectedAt:string,eventDate:string|null=null):Citation {
  return {id,publisher:'Câmara dos Deputados — Dados Abertos',title,url,documentId:id,eventDate,publishedAt:null,collectedAt,verifiedAt:collectedAt,excerpt:null,kind:'primary',verification:'official-import'};
}

export async function collectCamara(limit=24, options:CamaraFetchOptions={}):Promise<Politician[]> {
  if(!Number.isInteger(limit)||limit<1||limit>100) throw new Error('Limite deve ser um inteiro entre 1 e 100.');
  const collectedAt=new Date().toISOString();
  const deputies:z.infer<typeof deputySchema>[]=[];
  let page=1;
  while(deputies.length<limit && page<=10) {
    const url=`${API}/deputados?ordem=ASC&ordenarPor=nome&itens=${Math.min(100,limit)}&pagina=${page}`;
    const response=await fetchCamaraJson(url,options);
    const items=z.array(deputySchema).parse(response.dados);
    deputies.push(...items.slice(0,limit-deputies.length));
    if(!items.length || !response.links?.some(link=>link.rel==='next')) break;
    page++;
  }
  if(!deputies.length) throw new Error('Fonte retornou zero deputados; os dados anteriores foram preservados.');
  if(new Set(deputies.map(row=>row.id)).size!==deputies.length) throw new Error('IDs duplicados na paginação da fonte.');
  const records:Politician[]=[];
  // Four requests in flight at most; errors propagate before any database write.
  for(let i=0;i<deputies.length;i+=4) {
    const batch=await Promise.all(deputies.slice(i,i+4).map(async deputy=>{
      const detailUrl=`${API}/deputados/${deputy.id}`;
      const detail=deputyDetailSchema.parse((await fetchCamaraJson(detailUrl,options)).dados);
      if(detail.id!==deputy.id) throw new Error('ID divergente entre lista e detalhe da fonte.');
      const source=citation(`camara-deputado-${deputy.id}`,'Identificação e situação parlamentar informadas pela Câmara',detailUrl,collectedAt);
      const historyUrl=`${API}/deputados/${deputy.id}/historico`;
      const history=z.array(historyRawSchema).parse((await fetchCamaraJson(historyUrl,options)).dados);
      const timeline:TimelineEvent[]=history.map((event,index)=>({
        id:`camara:${deputy.id}:history:${index}`,date:event.dataHora,title:event.situacao||event.descricaoStatus||'Atualização cadastral',
        description:[event.descricaoStatus,event.siglaPartido,event.siglaUf].filter(Boolean).join(' · ')||event.situacao||'Atualização cadastral registrada pela Câmara.',
        source:citation(`camara-history-${deputy.id}-${index}`,'Histórico de situações parlamentares — não representa todo o histórico eleitoral',historyUrl,collectedAt,event.dataHora),
      })).sort((a,b)=>a.date.localeCompare(b.date));
      const proposalsUrl=`${API}/proposicoes?idDeputadoAutor=${deputy.id}&itens=5&ordem=DESC&ordenarPor=id`;
      const proposalResponse=await fetchCamaraJson(proposalsUrl,options);
      const proposals:Proposal[]=z.array(proposalRawSchema).parse(proposalResponse.dados).map(item=>({
        id:`camara-proposicao:${item.id}`,code:`${item.siglaTipo} ${item.numero}/${item.ano}`,title:item.ementa?.trim()||'Ementa não informada pela fonte',
        date:null,status:'Proposição registrada — tramitação não importada',
        source:citation(`camara-proposicao-${item.id}`,'Proposição listada por vínculo de autoria — autoria não implica implementação',`${API}/proposicoes/${item.id}`,collectedAt),
      }));
      const latest=detail.ultimoStatus;
      return {
        id:`camara:${deputy.id}`,officialId:deputy.id,name:latest.nome,fullName:detail.nomeCivil??null,
        party:latest.siglaPartido,uf:latest.siglaUf,role:'Deputado(a) federal',municipality:null,status:latest.situacao||'Situação não informada pela fonte',
        legislature:latest.idLegislatura,photoUrl:null,referenceDate:collectedAt.slice(0,10),collectedAt,coverage:'live' as const,
        education:detail.escolaridade??null,source,timeline,proposals,legalRecords:[],
      } satisfies Politician;
    }));
    records.push(...batch);
  }
  return records;
}
export async function importCamara(limit=24, options:CamaraFetchOptions={}) {
  const runId=beginImport(`${API}/deputados — primeiros ${limit} nomes em ordem alfabética`);
  try {
    const records=await collectCamara(limit,options);
    const count=savePoliticians(records,{replaceActive:true});
    finishImport(runId,'success',count,'Identificação, histórico parlamentar e até 5 proposições por deputado importados. Não é cobertura de todo o eleitorado nem de toda a produção legislativa.');
    return {runId,count};
  } catch(error) {
    const message=error instanceof Error ? error.message : 'Falha não identificada na importação.';
    finishImport(runId,'failed',0,`${message} Cache anterior preservado.`);
    throw new Error(`Importação não concluída: ${message}`,{cause:error});
  }
}

import {createHmac,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
export const SESSION_COOKIE='civis_session';
export function adminConfigured(){return (process.env.CIVIS_ADMIN_PASSWORD?.length??0)>=16}
const attempts=new Map<string,{count:number;until:number}>();
export function allowAttempt(key:string,limit=5,windowMs=15*60*1000){const now=Date.now();for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);if(attempts.size>5000)return false;const entry=attempts.get(key)??{count:0,until:now+windowMs};entry.count++;attempts.set(key,entry);return entry.count<=limit}
export function verifyPassword(value:string){if(!adminConfigured()||value.length>256)return false;const salt='civis-admin-v1';return timingSafeEqual(scryptSync(value,salt,32),scryptSync(process.env.CIVIS_ADMIN_PASSWORD!,salt,32))}
function sessionKey(){if(process.env.CIVIS_SESSION_KEY&&process.env.CIVIS_SESSION_KEY.length>=32)return process.env.CIVIS_SESSION_KEY;const dir=path.dirname(path.resolve(/* turbopackIgnore: true */ process.env.CIVIS_DB_PATH??'var/civis.db'));mkdirSync(dir,{recursive:true});const file=path.join(dir,'session.key');if(!existsSync(file)){try{writeFileSync(file,randomBytes(48).toString('hex'),{mode:0o600,flag:'wx'})}catch(e){if(!existsSync(file))throw e}}return readFileSync(file,'utf8').trim()}
function sign(value:string){return createHmac('sha256',sessionKey()).update(process.env.CIVIS_ADMIN_PASSWORD??'').update('\0').update(value).digest('base64url')}
export function createSession(){const payload=Buffer.from(JSON.stringify({actor:process.env.CIVIS_ADMIN_NAME??'editor-local',exp:Date.now()+8*60*60*1000,nonce:randomBytes(16).toString('hex')})).toString('base64url');return `${payload}.${sign(payload)}`}
export function readSession(token:string|undefined):{actor:string}|null{if(!token||!adminConfigured()||token.length>2048)return null;try{const [payload,mac]=token.split('.');const expected=Buffer.from(sign(payload));const got=Buffer.from(mac??'');if(expected.length!==got.length||!timingSafeEqual(expected,got))return null;const data=JSON.parse(Buffer.from(payload,'base64url').toString());if(typeof data.actor!=='string'||!Number.isFinite(data.exp)||data.exp<Date.now())return null;return {actor:data.actor}}catch{return null}}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');if(!origin)return false;try{const expected=new URL(process.env.CIVIS_PUBLIC_ORIGIN??request.url);if(!process.env.CIVIS_PUBLIC_ORIGIN&&request.headers.get('host'))expected.host=request.headers.get('host')!;return new URL(origin).origin===expected.origin}catch{return false}}
export async function readJsonBody(request:Request,maxBytes:number):Promise<unknown>{
 const reader=request.body?.getReader();if(!reader)throw new Error('Corpo JSON obrigatório.');
 let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new Error('Pedido muito grande.')}chunks.push(value)}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {z} from 'zod';
import {adminConfigured,allowAttempt,createSession,verifyPassword,SESSION_COOKIE,readSession,sameOrigin,readJsonBody} from '@/lib/security';
import {saveDraft,reviewRecord,auditAction} from '@/lib/editorial';
import {importCamara} from '@/lib/camara';
import {importSenado} from '@/lib/senado';
export async function POST(req:Request,{params}:{params:Promise<{action:string}>}){
 if(!sameOrigin(req))return NextResponse.json({error:'Origem não permitida.'},{status:403});
 if(!adminConfigured())return NextResponse.json({error:'Administração desativada. Configure uma senha exclusiva.'},{status:503});
 const {action}=await params;const jar=await cookies();
 if(Number(req.headers.get('content-length')??0)>64000)return NextResponse.json({error:'Pedido muito grande.'},{status:413});
 try{
  const input=await readJsonBody(req,64000);
  if(action==='login'){
   if(!allowAttempt('admin-login'))return NextResponse.json({error:'Limite de tentativas. Aguarde 15 minutos.'},{status:429});
   const {password}=z.object({password:z.string().min(1).max(256)}).parse(input);
   if(!verifyPassword(password))return NextResponse.json({error:'Credenciais inválidas.'},{status:401});
   jar.set(SESSION_COOKIE,createSession(),{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:8*3600});return NextResponse.json({message:'Sessão iniciada.'});
  }
  const session=readSession(jar.get(SESSION_COOKIE)?.value);
  if(!session)return NextResponse.json({error:'Autenticação necessária.'},{status:401});
  if(action==='logout'){jar.delete(SESSION_COOKIE);return NextResponse.json({message:'Sessão encerrada.'})}
  if(action==='import'){
   if(!allowAttempt('import',1,60000))return NextResponse.json({error:'Uma atualização por minuto. Aguarde.'},{status:429});
   const camara=await importCamara(513);const senado=await importSenado(81);auditAction(camara.runId,session.actor,'official-import','Atualização manual das listas correntes da Câmara e do Senado com fontes oficiais.');return NextResponse.json({message:`${camara.count + senado.count} registros importados.`});
  }
  if(action==='draft'){const d=z.object({politicianId:z.string().regex(/^(?:camara|senado):\d+$/),title:z.string().min(3).max(250),reason:z.string().min(15).max(2000),payload:z.unknown()}).parse(input);const record=saveDraft(d,session.actor,d.reason);return NextResponse.json({id:record.id,message:'Rascunho salvo; ainda não publicado.'},{status:201})}
  if(action==='review'){const d=z.object({id:z.string().uuid(),decision:z.enum(['approved','rejected']),reason:z.string().min(15).max(2000)}).parse(input);reviewRecord(d.id,d.decision,session.actor,d.reason);return NextResponse.json({message:'Revisão registrada com responsável e justificativa.'})}
  return NextResponse.json({error:'Ação desconhecida.'},{status:404});
 }catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:'Dados inválidos. '+e.issues.map(i=>i.message).join(' ').slice(0,1200)},{status:400});return NextResponse.json({error:e instanceof Error?e.message.slice(0,1500):'Falha na operação.'},{status:400})}
}

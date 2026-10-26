import {NextResponse} from 'next/server';
import {z} from 'zod';
import {submitCorrection} from '@/lib/db';
import {sameOrigin,readJsonBody,allowAttempt} from '@/lib/security';
const schema=z.object({politicianId:z.string().regex(/^camara:\d+$/),subject:z.string().trim().min(20).max(2000),evidenceUrl:z.url().max(2000).refine(s=>{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password},'Use um link HTTPS sem credenciais.'),website:z.string().max(0).optional()});
export async function POST(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Origem não permitida.'},{status:403});if(Number(req.headers.get('content-length')??0)>12000)return NextResponse.json({error:'Pedido muito grande.'},{status:413});if(!allowAttempt('public-corrections',30,60000))return NextResponse.json({error:'Muitas solicitações. Aguarde um minuto.'},{status:429});try{const input=schema.parse(await readJsonBody(req,12000));return NextResponse.json(submitCorrection(input),{status:201})}catch{return NextResponse.json({error:'Confira o perfil, a descrição (20–2000 caracteres) e o link documental HTTPS.'},{status:400})}}

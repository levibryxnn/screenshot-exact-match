import {NextResponse} from 'next/server';
import {getPolitician} from '@/lib/db';
import {withEditorial} from '@/lib/editorial';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const p=getPolitician(id);return p?NextResponse.json(withEditorial(p)):NextResponse.json({error:'Perfil não encontrado.'},{status:404})}

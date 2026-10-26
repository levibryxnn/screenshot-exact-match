import {NextResponse} from 'next/server';
import {getDataStatus} from '@/lib/db';
export function GET(){try{return NextResponse.json({status:'ok',data:getDataStatus()})}catch{return NextResponse.json({status:'error'},{status:503})}}

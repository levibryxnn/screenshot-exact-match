import Link from 'next/link';
import {Compare} from '@/components/Compare';
import {getPolitician} from '@/lib/db';
import {withEditorial} from '@/lib/editorial';
export const metadata={title:'Comparar trajetórias'};
export default async function ComparePage({searchParams}:{searchParams:Promise<{ids?:string}>}){const params=await searchParams;const ids=[...new Set((params.ids??'').split(','))].filter(s=>/^(?:camara|senado):\d+$/.test(s)).slice(0,4);const records=ids.map(getPolitician).filter(p=>p!==null).map(withEditorial);return <main id="conteudo" className="page"><Link href="/" className="back-link">← Voltar à seleção</Link><Compare politicians={records}/></main>}

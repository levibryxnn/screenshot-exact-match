import {notFound} from 'next/navigation';
import {Profile} from '@/components/Profile';
import {getPolitician} from '@/lib/db';
import {withEditorial} from '@/lib/editorial';
import {parsePoliticianId} from '@/lib/ids';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const id=parsePoliticianId((await params).id);const p=id?getPolitician(id):null;return {title:p?.name??'Perfil não encontrado'}}
export default async function ProfilePage({params}:{params:Promise<{id:string}>}){const id=parsePoliticianId((await params).id);const p=id?getPolitician(id):null;if(!p)notFound();return <main id="conteudo" className="page"><Profile politician={withEditorial(p)}/></main>}

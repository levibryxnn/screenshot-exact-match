import {cookies} from 'next/headers';
import {Admin} from '@/components/Admin';
import {adminConfigured,readSession,SESSION_COOKIE} from '@/lib/security';
import {getImportRuns,listCorrections} from '@/lib/db';
import {listEditorial,listAudit} from '@/lib/editorial';
export const metadata={title:'Área editorial',robots:{index:false,follow:false}};
export default async function AdminPage(){const session=readSession((await cookies()).get(SESSION_COOKIE)?.value);return <main id="conteudo" className="page"><Admin configured={adminConfigured()} authenticated={!!session} actor={session?.actor??null} runs={session?getImportRuns():[]} corrections={session?listCorrections():[]} records={session?listEditorial():[]} audit={session?listAudit():[]}/></main>}

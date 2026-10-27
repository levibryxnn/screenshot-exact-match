import {Selector} from '@/components/Selector';
import {listAllPoliticianSummaries,getDataStatus} from '@/lib/db';
export default function Home(){const politicians=listAllPoliticianSummaries();return <main id="conteudo"><Selector politicians={politicians} status={getDataStatus()}/></main>}

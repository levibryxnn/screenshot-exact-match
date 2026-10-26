import {Selector} from '@/components/Selector';
import {listPoliticians,getDataStatus} from '@/lib/db';
export default function Home(){const result=listPoliticians({pageSize:100});return <main id="conteudo"><Selector politicians={result.items} status={getDataStatus()}/></main>}

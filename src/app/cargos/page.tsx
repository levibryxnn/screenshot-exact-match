import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowDown, ArrowUpRight, Building2, Landmark, Map, MapPin, Scale, ShieldCheck,
  Users, Vote, BriefcaseBusiness, BookOpenText, CircleHelp,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Quem faz o quê? Guia dos cargos públicos',
  description: 'Entenda, em linguagem simples, o que fazem vereadores, prefeitos, deputados, senadores, governadores e o presidente — e onde cada um trabalha.',
};

const constitution = 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm';

const levels = [
  {
    id: 'municipio', number: '01', label: 'Na sua cidade', place: 'Município', icon: Building2,
    summary: 'Cuida de serviços que você usa por perto: ruas, coleta de lixo, ônibus da cidade, postos de saúde e escolas municipais.',
    actors: 'Prefeitura + Câmara Municipal',
  },
  {
    id: 'estado', number: '02', label: 'No seu estado', place: 'Estado ou Distrito Federal', icon: Map,
    summary: 'Cuida de serviços que atendem várias cidades: polícia estadual, estradas estaduais, escolas de ensino médio e hospitais estaduais.',
    actors: 'Governo do Estado + Assembleia Legislativa',
  },
  {
    id: 'brasil', number: '03', label: 'No Brasil', place: 'União (governo federal)', icon: Landmark,
    summary: 'Cuida de assuntos nacionais, como defesa do país, moeda e políticas federais. O Congresso faz as leis nacionais e fiscaliza o governo.',
    actors: 'Presidência + Congresso Nacional',
  },
];

const offices = [
  {
    level: 'municipio', kind: 'Legislativo', name: 'Vereador(a)', workplace: 'Câmara Municipal', icon: Vote,
    does: 'Propõe e vota leis da cidade, aprova o orçamento e fiscaliza o trabalho do prefeito.',
    example: 'Pode cobrar explicações sobre a coleta de lixo e votar uma regra municipal.',
    limit: 'Não comanda a prefeitura e não executa serviços como asfaltar uma rua.',
    source: 'Artigos 29 a 31', anchor: '#art29',
  },
  {
    level: 'municipio', kind: 'Executivo', name: 'Prefeito(a)', workplace: 'Prefeitura', icon: Building2,
    does: 'Administra a cidade: organiza serviços, equipes e o uso do dinheiro municipal.',
    example: 'Cuida, junto com outras esferas, de postos de saúde, creches, ruas e transporte municipal.',
    limit: 'Não decide tudo sozinho: precisa seguir as leis e o orçamento aprovados pela Câmara.',
    source: 'Artigos 29 e 30', anchor: '#art30',
  },
  {
    level: 'municipio', kind: 'Executivo', name: 'Vice-prefeito(a)', workplace: 'Prefeitura', icon: Users,
    does: 'É eleito na mesma chapa do prefeito. Pode substituir o prefeito quando ele não puder exercer o cargo e ajudar em tarefas que receber.',
    example: 'Se o prefeito se afasta, o vice pode assumir temporariamente conforme a lei.',
    limit: 'Não tem, por conta própria, o comando diário da prefeitura.',
    source: 'Artigo 29, inciso I', anchor: '#art29',
  },
  {
    level: 'estado', kind: 'Legislativo', name: 'Deputado(a) estadual', workplace: 'Assembleia Legislativa', icon: Vote,
    does: 'Propõe e vota leis do estado, discute o orçamento estadual e fiscaliza o governador.',
    example: 'Pode cobrar dados sobre hospitais estaduais e votar regras que valem no estado.',
    limit: 'Não administra as secretarias do governo nem comanda prefeitos.',
    source: 'Artigo 27', anchor: '#art27',
  },
  {
    level: 'estado', kind: 'Legislativo', name: 'Deputado(a) distrital', workplace: 'Câmara Legislativa do DF', icon: Vote,
    does: 'No Distrito Federal, exerce funções de deputado estadual e de vereador: vota leis e fiscaliza o governo local.',
    example: 'Discute regras e orçamento para serviços do Distrito Federal.',
    limit: 'O DF não tem municípios nem vereadores; sua Câmara Legislativa reúne essas funções.',
    source: 'Artigo 32, § 3º', anchor: '#art32',
  },
  {
    level: 'estado', kind: 'Executivo', name: 'Governador(a)', workplace: 'Governo do Estado', icon: Building2,
    does: 'Administra o estado e organiza serviços estaduais, junto com as leis e o orçamento.',
    example: 'Responde pela rede estadual de ensino médio e pelas polícias Civil e Militar estaduais.',
    limit: 'Não manda na prefeitura. Saúde, educação e segurança também podem ter responsabilidades divididas.',
    source: 'Artigo 28', anchor: '#art28',
  },
  {
    level: 'estado', kind: 'Executivo', name: 'Vice-governador(a)', workplace: 'Governo do Estado', icon: Users,
    does: 'É eleito na mesma chapa do governador. Pode substituí-lo e assumir o cargo se houver vacância, conforme a Constituição.',
    example: 'Pode assumir o governo durante uma viagem ou afastamento do titular.',
    limit: 'As tarefas de apoio dependem das regras e das atribuições que receber.',
    source: 'Artigo 28', anchor: '#art28',
  },
  {
    level: 'brasil', kind: 'Legislativo', name: 'Deputado(a) federal', workplace: 'Câmara dos Deputados', icon: Vote,
    does: 'Propõe e vota leis para todo o Brasil, participa do orçamento federal e fiscaliza o governo federal.',
    example: 'Pode votar uma lei nacional e pedir explicações a ministros.',
    limit: 'Não é administrador de um estado nem prefeito da sua cidade.',
    source: 'Artigo 45', anchor: '#art45',
  },
  {
    level: 'brasil', kind: 'Legislativo', name: 'Senador(a)', workplace: 'Senado Federal', icon: Landmark,
    does: 'Vota leis nacionais e representa os estados e o Distrito Federal no Congresso. Também analisa algumas indicações importantes.',
    example: 'Uma proposta aprovada por deputados também pode ser analisada pelos senadores.',
    limit: 'Não representa só uma cidade: cada estado e o DF elegem senadores.',
    source: 'Artigos 46 e 52', anchor: '#art46',
  },
  {
    level: 'brasil', kind: 'Executivo', name: 'Presidente da República', workplace: 'Presidência e órgãos federais', icon: ShieldCheck,
    does: 'Dirige o governo federal e os ministérios, executa políticas federais e apresenta propostas e orçamento ao Congresso.',
    example: 'Pode sancionar uma lei aprovada pelo Congresso ou vetá-la, explicando a decisão.',
    limit: 'Não cria uma lei sozinho: leis são discutidas e votadas pelo Congresso.',
    source: 'Artigos 76 e 84', anchor: '#art76',
  },
  {
    level: 'brasil', kind: 'Executivo', name: 'Vice-presidente da República', workplace: 'Governo Federal', icon: Users,
    does: 'É eleito junto com o presidente. Substitui o titular em impedimentos e pode assumir a Presidência em caso de vaga.',
    example: 'Pode representar o país ou cumprir missões dadas pelo presidente.',
    limit: 'As tarefas de apoio dependem do que o presidente lhe confiar.',
    source: 'Artigo 79', anchor: '#art79',
  },
  {
    level: 'brasil', kind: 'Governo (não eleito)', name: 'Ministro(a)', workplace: 'Ministério federal', icon: BriefcaseBusiness,
    does: 'É escolhido pelo presidente para cuidar de uma área do governo federal, como saúde, educação ou transporte.',
    example: 'O ministro da Saúde coordena o ministério e ajuda a executar políticas federais da área.',
    limit: 'Não é eleito pelo voto popular e deve seguir a lei e as decisões do governo.',
    source: 'Artigos 87 e 88', anchor: '#art87',
  },
  {
    level: 'municipio', kind: 'Governo (não eleito)', name: 'Secretário(a)', workplace: 'Secretaria municipal ou estadual', icon: BriefcaseBusiness,
    does: 'É escolhido pelo prefeito ou governador para organizar uma área, como saúde, educação ou obras.',
    example: 'A secretaria organiza o serviço; a prefeitura ou o governo responde pela administração.',
    limit: 'Não é um cargo escolhido diretamente pelo voto. As atribuições variam conforme a lei local.',
    source: 'Constituição e leis locais', anchor: '#art30',
  },
];

function OfficeCard({ office, index }: { office: typeof offices[number]; index: number }) {
  const Icon = office.icon;
  return (
    <article className="office-card">
      <div className="office-card-top">
        <span className="office-index">{String(index + 1).padStart(2, '0')}</span>
        <span className={`office-kind ${office.kind.startsWith('Governo') ? 'is-appointed' : ''}`}>{office.kind}</span>
        <span className="office-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.7} /></span>
      </div>
      <h3>{office.name}</h3>
      <p className="office-workplace"><MapPin size={14} aria-hidden="true" />{office.workplace}</p>
      <div className="office-explainer">
        <div><h4>O que faz</h4><p>{office.does}</p></div>
        <div><h4>Exemplo do dia a dia</h4><p>{office.example}</p></div>
      </div>
      <p className="office-limit"><CircleHelp size={15} aria-hidden="true" /><span><strong>Bom saber:</strong> {office.limit}</span></p>
      <a className="office-source" href={`${constitution}${office.anchor}`} target="_blank" rel="noreferrer">
        <BookOpenText size={14} aria-hidden="true" /> Constituição Federal · {office.source}<ArrowUpRight size={13} aria-hidden="true" />
      </a>
    </article>
  );
}

export default function CargosPage() {
  return (
    <main id="conteudo" className="page civic-guide">
      <header className="guide-hero">
        <div className="guide-hero-copy">
          <p className="eyebrow"><span className="status-dot" />GUIA RÁPIDO · ENTENDA QUEM CUIDA DO QUÊ</p>
          <h1>Quem faz <em>o quê</em><br />no poder público?</h1>
          <p className="guide-lead">Uma explicação direta dos cargos: onde trabalham, o que podem fazer e a quem você pode cobrar. Sem precisar decorar palavras difíceis.</p>
          <a className="guide-jump" href="#mapa"><span>Veja o mapa dos governos</span><ArrowDown size={15} aria-hidden="true" /></a>
        </div>
        <aside className="guide-hero-note" aria-label="Como usar este guia">
          <span className="guide-note-mark"><Scale size={21} strokeWidth={1.5} aria-hidden="true" /></span>
          <p><strong>Uma dica:</strong> muitos serviços são divididos entre Prefeitura, Estado e Governo Federal. Veja de quem é a responsabilidade antes de cobrar.</p>
          <span className="guide-note-index">LEIA · COMPARE · COBRE</span>
        </aside>
      </header>

      <section id="mapa" className="guide-map" aria-labelledby="map-heading">
        <div className="guide-section-heading">
          <div><p className="eyebrow">TRÊS NÍVEIS DE GOVERNO</p><h2 id="map-heading">Comece pelo lugar</h2></div>
          <p>O nível muda conforme o tamanho do assunto.</p>
        </div>
        <div className="level-grid">
          {levels.map(({ id, number, label, place, icon: Icon, summary, actors }) => (
            <a className="level-card" href={`#${id}`} key={id}>
              <div className="level-card-top"><span>{number} / {label}</span><Icon size={20} strokeWidth={1.6} aria-hidden="true" /></div>
              <h3>{place}</h3>
              <p>{summary}</p>
              <span className="level-actors">{actors}<ArrowDown size={13} aria-hidden="true" /></span>
            </a>
          ))}
        </div>
      </section>

      <section className="guide-vocab" aria-label="Diferença entre fazer leis e executar serviços">
        <div className="vocab-cell"><span className="vocab-symbol" aria-hidden="true"><Vote size={19} /></span><div><strong>Legislativo</strong><p>Faz e vota leis. Também fiscaliza o governo.</p></div></div>
        <div className="vocab-divider" aria-hidden="true"><ArrowUpRight size={15} /></div>
        <div className="vocab-cell"><span className="vocab-symbol is-gold" aria-hidden="true"><Building2 size={19} /></span><div><strong>Executivo</strong><p>Administra serviços e coloca políticas em prática.</p></div></div>
        <p className="vocab-footnote">Nenhum cargo pode fazer tudo sozinho: existem leis, orçamento e fiscalização.</p>
      </section>

      {levels.map(group => {
        const sectionOffices = offices.filter(office => office.level === group.id);
        const title = group.id === 'municipio' ? 'Na cidade' : group.id === 'estado' ? 'No estado e no DF' : 'No Brasil';
        return (
          <section className="office-section" id={group.id} key={group.id} aria-labelledby={`heading-${group.id}`}>
            <div className="guide-section-heading office-section-heading">
              <div><p className="eyebrow">{group.number} · {group.place.toUpperCase()}</p><h2 id={`heading-${group.id}`}>{title}</h2></div>
              <a href="#mapa">Voltar ao mapa <ArrowUpRight size={13} aria-hidden="true" /></a>
            </div>
            <div className="office-grid">
              {sectionOffices.map(office => <OfficeCard key={office.name} office={office} index={offices.indexOf(office)} />)}
            </div>
          </section>
        );
      })}

      <section className="guide-where-to-go" aria-labelledby="where-heading">
        <div className="where-icon"><CircleHelp size={23} strokeWidth={1.6} aria-hidden="true" /></div>
        <div><p className="eyebrow">NA DÚVIDA, PERGUNTE</p><h2 id="where-heading">A quem eu procuro?</h2>
          <div className="where-examples">
            <p><strong>O posto de saúde do bairro está sem remédio?</strong><span>Comece pela Prefeitura e pela Secretaria Municipal de Saúde. Se for hospital estadual, procure o Governo do Estado.</span></p>
            <p><strong>Quer reclamar de uma lei ou de um gasto?</strong><span>Procure o vereador, deputado ou senador que fiscaliza aquele nível de governo.</span></p>
            <p><strong>O problema envolve uma regra nacional?</strong><span>Deputados federais e senadores discutem as leis do Brasil; o governo federal executa políticas nacionais.</span></p>
          </div>
        </div>
      </section>

      <section className="guide-notes" aria-labelledby="notes-heading">
        <h2 id="notes-heading">Duas coisas importantes</h2>
        <div><p><strong>As responsabilidades podem ser compartilhadas.</strong> Por exemplo, Prefeitura, Estado e União participam do SUS. A divisão também depende das leis e do orçamento.</p><p><strong>Juízes e tribunais fazem parte da Justiça.</strong> Eles julgam casos seguindo a lei; não são cargos eleitos e não administram os governos. A Justiça é independente dos Poderes Executivo e Legislativo.</p></div>
      </section>

      <footer className="guide-source-footer">
        <span>Conteúdo educativo baseado na Constituição Federal, especialmente nos artigos indicados em cada cargo.</span>
        <a href={constitution} target="_blank" rel="noreferrer">Abrir Constituição Federal <ArrowUpRight size={14} aria-hidden="true" /></a>
        <Link href="/metodologia">Como conferimos as informações <ArrowUpRight size={14} aria-hidden="true" /></Link>
      </footer>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, Columns2, Info } from 'lucide-react';
import type { Politician } from '@/lib/types';
import Citation, { formatDate } from './Citation';
import { Portrait } from './Selector';
import { legalStatusLabels } from './Profile';

export default function Compare({ politicians }: { politicians: Politician[] }) {
  const compatible = new Set(politicians.map(p => `${p.role}|${p.legislature}|${p.referenceDate || ''}`)).size <= 1;
  const rows: { label: string; render: (p: Politician) => React.ReactNode }[] = [
    { label: 'Cargo na referência', render: p => <>{p.role}<Citation source={p.source} /></> },
    { label: 'Partido e localização', render: p => <>{p.party} · {p.uf}<p className="muted">{p.municipality || 'Município não informado'}</p><Citation source={p.source} /></> },
    { label: 'Data de referência', render: p => <>{formatDate(p.referenceDate)}<p className="muted">{p.coverage === 'historical' ? 'Registro histórico' : 'Fonte oficial'}</p><Citation source={p.source} /></> },
    { label: 'Situação no registro', render: p => <>{p.status}<Citation source={p.source} /></> },
    { label: 'Trajetória documentada', render: p => p.timeline.length ? <ul className="compare-events">{p.timeline.map(event => <li key={event.id}><time>{formatDate(event.date)}</time><strong>{event.title}</strong><Citation source={event.source} /></li>)}</ul> : <span className="muted">Ainda não verificada</span> },
    { label: 'Propostas no recorte', render: p => p.proposals.length ? <ul className="compare-events">{p.proposals.map(proposal => <li key={proposal.id}><strong>{proposal.code}</strong><p>{proposal.title}</p><span className="muted">{proposal.status}</span><Citation source={proposal.source} /></li>)}</ul> : <span className="muted">Não importadas. Ausência de dados não indica ausência de atuação.</span> },
    { label: 'Registros jurídicos revisados', render: p => p.legalRecords.length ? <ul className="compare-events">{p.legalRecords.map(record => <li key={record.id}><strong>{record.title}</strong><p>{legalStatusLabels[record.status]}</p><Citation source={record.source} /></li>)}</ul> : <span className="muted">Nenhum registro revisado nesta base. Não permite concluir inexistência de processos.</span> },
    { label: 'Votações e gastos', render: () => <span className="muted">Informação ainda não verificada</span> },
    { label: 'Promessas e patrimônio', render: () => <span className="muted">Informação ainda não verificada</span> },
  ];
  return <div className="compare-page"><div className="page-intro"><div className="eyebrow">02 <span className="line-divider" /> INFORMAÇÃO EM PERSPECTIVA</div><h1>Compare fatos.<br /><span>Preserve o contexto.</span></h1><p>Cargos, períodos e fontes lado a lado. Sem uma nota geral e sem decidir por você.</p></div>
    {politicians.length < 2 ? <div className="empty-state"><Columns2 size={32} /><h2>{politicians.length ? 'Escolha mais um perfil' : 'Quem você quer comparar?'}</h2><p>Na seleção, adicione de dois a quatro perfis à comparação.</p>{politicians[0] && <span className="tag">Selecionado: {politicians[0].name}</span>}<Link className="button primary" href="/">Explorar perfis<ArrowRight size={16} /></Link></div> : <><div className="editorial-note"><Info size={20} /><p>{compatible ? 'Mesmo cargo e referência no recorte selecionado. A cobertura disponível pode variar entre os perfis.' : 'Há diferenças de cargo, período ou referência. As atribuições e oportunidades de atuação podem ser distintas; números brutos não devem ser tratados como medida de desempenho.'} Informações ausentes permanecem identificadas.</p></div><div className="comparison-table-wrapper" tabIndex={0} role="region" aria-label="Tabela comparativa, role horizontalmente para ver todos os perfis"><table className="comparison-table"><caption className="sr-only">Comparação documental dos políticos selecionados</caption><thead><tr><th scope="col">DIMENSÃO<br /><span>DOCUMENTAL</span></th>{politicians.map(p => <th scope="col" key={p.id}><div className="compare-portrait"><Portrait politician={p} /></div><span className="tag">{p.party} / {p.uf}</span><h2>{p.name}</h2><Link href={`/politicos/${encodeURIComponent(p.id)}`} className="text-link">Abrir perfil<ArrowUpRight size={13} /></Link></th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th>{politicians.map(p => <td key={p.id}>{row.render(p)}</td>)}</tr>)}</tbody></table></div><p className="compare-footnote">A tabela apresenta o material disponível, sem estabelecer equivalência entre situações distintas. Uma investigação não comprova culpa; decisões favoráveis e mudanças de situação devem permanecer no histórico.</p></>}
  </div>;
}
export { Compare };

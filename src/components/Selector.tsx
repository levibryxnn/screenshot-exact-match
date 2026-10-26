'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, CircleHelp, Columns2, Fingerprint, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import type { DataStatus, Politician } from '@/lib/types';
import Citation, { formatDate } from './Citation';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
export function initials(name: string) { return name.split(/\s+/).filter(Boolean).map(s => s[0]).slice(0, 2).join(''); }
export function Portrait({ politician, large = false }: { politician: Politician; large?: boolean }) {
  return <div className={`portrait ${large ? 'portrait-large' : ''}`} aria-hidden="true">
    <div className="portrait-lines" /><span className="portrait-initials">{initials(politician.name)}</span><span className="portrait-marker">BR / {politician.uf}</span><span className="portrait-caption">RETRATO NÃO DISPONÍVEL</span>
  </div>;
}
const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'pt-BR'));

export default function Selector({ politicians, status }: { politicians: Politician[]; status: DataStatus }) {
  const [query, setQuery] = useState('');
  const [party, setParty] = useState('');
  const [uf, setUf] = useState('');
  const [role, setRole] = useState('');
  const [mandateStatus, setMandateStatus] = useState('');
  const [selectedId, setSelectedId] = useState(politicians[0]?.id || '');
  const [compared, setCompared] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [compareMessage, setCompareMessage] = useState('');
  const filtered = useMemo(() => politicians.filter(p => normalize(`${p.name} ${p.fullName || ''}`).includes(normalize(query)) && (!party || p.party === party) && (!uf || p.uf === uf) && (!role || p.role === role) && (!mandateStatus || p.status === mandateStatus)), [politicians, query, party, uf, role, mandateStatus]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 8)));
  const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
  const selected = filtered.find(p => p.id === selectedId) || filtered[0];
  const comparedPoliticians = politicians.filter(p => compared.includes(p.id));
  function compare(id: string) {
    if (compared.includes(id)) { setCompared(compared.filter(i => i !== id)); setCompareMessage(''); return; }
    if (compared.length === 4) { setCompareMessage('Você pode comparar até quatro perfis. Remova um para adicionar outro.'); return; }
    setCompared([...compared, id]); setCompareMessage('');
  }
  function reset() { setQuery(''); setParty(''); setUf(''); setRole(''); setMandateStatus(''); setPage(1); }
  function selectAdjacent(direction: number) {
    if (!selected || !filtered.length) return;
    const index = filtered.findIndex(p => p.id === selected.id);
    const nextIndex = (index + direction + filtered.length) % filtered.length;
    setSelectedId(filtered[nextIndex].id); setPage(Math.floor(nextIndex / 8) + 1);
  }
  const hasFilters = query || party || uf || role || mandateStatus;
  const compareUrl = `/comparar?ids=${compared.map(encodeURIComponent).join(',')}`;
  const historical = politicians.some(p => p.coverage === 'historical');
  const referenceYears = unique(politicians.map(p => p.referenceDate?.slice(0, 4) || '').filter(Boolean));
  function selectProfile(id: string) {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 580px)').matches) requestAnimationFrame(() => document.querySelector('.selected-panel')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.reducedMotion === 'true' ? 'instant' : 'smooth', block: 'start' }));
  }
  return <div className="selector-page">
    <section className="explore-intro">
      <div><div className="eyebrow"><span className="status-dot" />INFORMAÇÃO PÚBLICA. ESCOLHA CONSCIENTE.</div><h1>A política é pública.<br />Conheça <span>de perto.</span></h1><p>Explore trajetórias. Confira documentos.<br className="desktop-break" /> Forme suas próprias conclusões.</p></div>
      <div className="intro-aside"><div className="index-stamp"><Fingerprint size={28} strokeWidth={1} /><span>SEM NOTAS.<br />SEM LADOS.<br /><strong>COM FONTES.</strong></span></div><a href="#explorar" className="text-link">Explore os perfis<ArrowDown size={15} /></a></div>
    </section>
    <div className="coverage-strip"><span className="coverage-label">RECORTE DOCUMENTAL</span><span>Câmara dos Deputados · {historical ? `recorte histórico${referenceYears.length ? ` de ${referenceYears.join(' / ')}` : ''}. Cargos e partidos referem-se à data do documento.` : 'amostra documental. Consulte a referência de cada perfil.'}</span><Link href="/metodologia">Entenda a cobertura<ArrowUpRight /></Link></div>
    {status.stale && <p className="data-notice" role="status">Coleta antiga ou recorte histórico. Os registros não comprovam a situação atual; confira as datas e a fonte de cada perfil.</p>}
    {status.lastRun?.status === 'failed' && <p className="data-notice" role="status">A última atualização não foi concluída. Exibimos o último lote disponível, com sua data de referência.</p>}
    <section id="explorar" className="explorer" aria-label="Seleção de políticos">
      <div className="explorer-topline"><div className="eyebrow">01 <span className="line-divider" /> ESCOLHA UM PERFIL</div><span className="small-code">DADOS, NÃO JULGAMENTOS</span></div>
      <div className="filter-panel">
        <label className="search-field"><Search size={19} aria-hidden="true" /><span className="sr-only">Buscar político por nome</span><input placeholder="Quem você quer conhecer?" aria-label="Buscar político por nome" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />{query && <button onClick={() => { setQuery(''); setPage(1); }} aria-label="Limpar pesquisa"><X size={16} /></button>}</label>
        <div className="filter-fields"><SlidersHorizontal size={17} className="filter-icon" aria-hidden="true" />
          <label><span>Cargo</span><select aria-label="Filtrar por cargo" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}><option value="">Todos os cargos</option>{unique(politicians.map(p => p.role)).map(v => <option key={v}>{v}</option>)}</select></label>
          <label><span>Partido</span><select aria-label="Filtrar por partido" value={party} onChange={e => { setParty(e.target.value); setPage(1); }}><option value="">Todos</option>{unique(politicians.map(p => p.party)).map(v => <option key={v}>{v}</option>)}</select></label>
          <label><span>Estado</span><select aria-label="Filtrar por estado" value={uf} onChange={e => { setUf(e.target.value); setPage(1); }}><option value="">Todo o Brasil</option>{unique(politicians.map(p => p.uf)).map(v => <option key={v}>{v}</option>)}</select></label>
          <label><span>Mandato</span><select aria-label="Filtrar por situação do mandato" value={mandateStatus} onChange={e => { setMandateStatus(e.target.value); setPage(1); }}><option value="">Todas as situações</option>{unique(politicians.map(p => p.status)).map(v => <option key={v}>{v}</option>)}</select></label>
        </div>
      </div>
      <div className="results-heading"><p aria-live="polite"><strong>{filtered.length.toString().padStart(2, '0')}</strong> perfis no recorte{hasFilters ? ' com esses filtros' : ''}</p>{hasFilters ? <button className="text-link" onClick={reset}>Limpar filtros<X size={13} /></button> : <span>ORDEM ALFABÉTICA <ArrowDown size={12} /></span>}</div>
      {!selected ? <div className="empty-state"><Search size={28} /><h2>{politicians.length ? 'Nenhum perfil encontrado' : 'Aguardando dados documentados'}</h2><p>{politicians.length ? 'Experimente outro nome ou ajuste os filtros.' : 'Nenhum registro foi importado. Consulte a cobertura e o estado da integração.'}</p><button className="button" onClick={reset}>Limpar busca e filtros</button></div> : <div className="selection-layout">
        <div className="roster-column"><div className="roster-grid" aria-label="Perfis disponíveis">{visible.map((p, i) => <article key={p.id} className={`character-card ${selected.id === p.id ? 'is-selected' : ''}`}>
          <button className="character-select" onClick={() => selectProfile(p.id)} aria-pressed={selected.id === p.id} aria-label={`Selecionar ${p.name}`}>
            <span className="card-index">{String((currentPage - 1) * 8 + i + 1).padStart(2, '0')}</span><span className="card-selected-indicator">{selected.id === p.id ? <Check size={12} /> : <span />}</span>
            <Portrait politician={p} /><span className="card-info"><span className="card-party">{p.party} <span>/</span> {p.uf}</span><strong>{p.name}</strong><span className="card-role">{p.role}</span></span>
          </button><button onClick={() => compare(p.id)} className={`card-compare ${compared.includes(p.id) ? 'is-added' : ''}`} aria-pressed={compared.includes(p.id)} aria-label={`${compared.includes(p.id) ? 'Remover' : 'Adicionar'} ${p.name} ${compared.includes(p.id) ? 'da' : 'à'} comparação`}>{compared.includes(p.id) ? <Check size={12} /> : <Columns2 size={12} />}<span>{compared.includes(p.id) ? 'Selecionado' : 'Comparar'}</span></button>
        </article>)}</div><div className="roster-bottom"><span>Selecione um card para explorar</span><div className="pagination"><button aria-label="Página anterior" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><span>{currentPage} / {Math.max(1, Math.ceil(filtered.length / 8))}</span><button aria-label="Próxima página" disabled={currentPage >= Math.ceil(filtered.length / 8)} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></div></div></div>
        <aside className="selected-panel" aria-label="Perfil selecionado">
          <div className="selected-panel-top"><span className="eyebrow"><span className="status-dot" />PERFIL SELECIONADO</span><div className="adjacent-controls"><button aria-label="Selecionar perfil anterior" onClick={() => selectAdjacent(-1)}><ArrowLeft size={16} /></button><button aria-label="Selecionar próximo perfil" onClick={() => selectAdjacent(1)}><ArrowRight size={16} /></button></div></div>
          <div className="selected-visual"><Portrait politician={selected} large /><span className="visual-cross cross-top">+</span><span className="visual-cross cross-bottom">+</span><div className="visual-id">REGISTRO OFICIAL<br /><strong>CD · {selected.officialId}</strong></div><span className="visual-vertical">TRAJETÓRIAS EM PERSPECTIVA</span></div>
          <div className="selected-content"><div className="selected-meta"><span className="tag">{selected.party}</span><span><MapPin size={13} />{selected.uf}</span><span>{selected.coverage === 'historical' ? 'Registro histórico' : 'Fonte oficial'}</span></div><h2>{selected.name}</h2><p className="selected-role">{selected.role}</p><div className="selected-reference"><span>Referência do registro</span><strong>{formatDate(selected.referenceDate)}</strong></div><Citation source={selected.source} label="Conferir identificação na fonte" /><div className="selected-actions"><Link className="button primary" href={`/politicos/${encodeURIComponent(selected.id)}`}>Explorar perfil<ArrowUpRight size={17} /></Link><button className="button icon-button" aria-label={`${compared.includes(selected.id) ? 'Remover' : 'Adicionar'} ${selected.name} à comparação`} aria-pressed={compared.includes(selected.id)} onClick={() => compare(selected.id)}>{compared.includes(selected.id) ? <Check size={18} /> : <Columns2 size={18} />}</button></div></div>
        </aside>
      </div>}
    </section>
    <section className="principle-row"><div className="eyebrow">A INFORMAÇÃO É PÚBLICA.<br />A CONCLUSÃO É SUA.</div><p>Sem rankings de honestidade ou recomendações de voto. Cada informação tem contexto, data e uma fonte que você pode conferir.</p><Link href="/metodologia" className="text-link">Nossa metodologia<ArrowUpRight size={16} /></Link></section>
    {compared.length > 0 && <div className="comparison-dock" aria-label="Seleção para comparação"><div><Columns2 size={18} /><strong>{compared.length} / 4</strong><span className="dock-label">perfis para comparar</span></div><div className="dock-names">{comparedPoliticians.map(p => <button key={p.id} onClick={() => compare(p.id)} aria-label={`Remover ${p.name} da comparação`}>{p.name}<X size={12} /></button>)}</div><Link className={`button primary ${compared.length < 2 ? 'is-disabled' : ''}`} href={compareUrl} aria-disabled={compared.length < 2} onClick={e => { if (compared.length < 2) e.preventDefault(); }}>Comparar<ArrowRight size={15} /></Link><button className="dock-close" onClick={() => { setCompared([]); setCompareMessage(''); }} aria-label="Limpar comparação"><X size={17} /></button></div>}
    <p className="sr-only" role="status">{compareMessage || `${selected?.name ? `Perfil selecionado: ${selected.name}. ` : ''}${compared.length ? `${compared.length} perfis selecionados para comparação` : ''}`}</p>
    {compareMessage && <div className="compare-message" role="alert"><CircleHelp size={16} />{compareMessage}<button onClick={() => setCompareMessage('')} aria-label="Fechar aviso"><X size={14} /></button></div>}
  </div>;
}

export { Selector };

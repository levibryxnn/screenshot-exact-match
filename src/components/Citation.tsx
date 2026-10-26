'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, FileText, X } from 'lucide-react';
import type { Citation as CitationType } from '@/lib/types';

export function formatDate(value: string | null) {
  if (!value) return 'Não informada pela fonte';
  const day = value.slice(0, 10);
  const date = new Date(`${day}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default function Citation({ source, label = 'Ver fonte' }: { source: CitationType; label?: string }) {
  return <Dialog.Root>
    <Dialog.Trigger className="citation-button"><FileText size={13} aria-hidden="true" />{label}<ArrowUpRight size={12} aria-hidden="true" /></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="citation-dialog">
        <div className="eyebrow"><span className="status-dot" />Rastreabilidade documental</div>
        <Dialog.Title>{source.title}</Dialog.Title>
        <Dialog.Description>Consulte o registro de origem e o contexto desta informação. Uma fonte sustenta somente as afirmações documentadas nela.</Dialog.Description>
        <div className="citation-kind">{source.kind === 'primary' ? 'Fonte primária' : 'Fonte secundária'} <span>·</span> {source.verification === 'reviewed' ? 'Revisão humana registrada' : source.verification === 'official-import' ? 'Importação de fonte oficial' : 'Ainda não verificada'}</div>
        <dl className="source-details">
          <div><dt>Órgão / responsável</dt><dd>{source.publisher}</dd></div>
          <div><dt>Identificador documental</dt><dd>{source.documentId || 'Não informado'}</dd></div>
          <div><dt>Data do fato / referência</dt><dd>{formatDate(source.eventDate)}</dd></div>
          <div><dt>Publicação</dt><dd>{formatDate(source.publishedAt)}</dd></div>
          <div><dt>Coleta</dt><dd>{formatDate(source.collectedAt)}</dd></div>
          <div><dt>Última verificação</dt><dd>{formatDate(source.verifiedAt)}</dd></div>
        </dl>
        {source.excerpt && <blockquote>{source.excerpt}</blockquote>}
        <a className="button primary" href={source.url} target="_blank" rel="noopener noreferrer">Abrir documento original<ArrowUpRight size={16} /></a>
        <p className="source-url">{source.url}</p>
        <Dialog.Close className="dialog-close" aria-label="Fechar fonte"><X size={20} /></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export { Citation };

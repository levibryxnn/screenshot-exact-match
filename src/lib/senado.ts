import * as http from 'node:http';
import { z } from 'zod';
import type { Citation, Politician, TimelineEvent } from './types';
import { beginImport, finishImport, savePoliticians } from './db';

const httpWithProxy = http as unknown as { setGlobalProxyFromEnv?: (env: NodeJS.ProcessEnv) => () => void };
if (process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy) httpWithProxy.setGlobalProxyFromEnv?.(process.env);

export const SENADO_LIST_URL = 'https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json';
const jsonSchema = z.object({ ListaParlamentarEmExercicio: z.object({ Parlamentares: z.object({ Parlamentar: z.union([z.array(z.unknown()), z.unknown()]) }) }) });
export interface SenadoFetchOptions { fetcher?: typeof fetch; timeoutMs?: number; retries?: number }

export function assertSenadoUrl(input: string): URL {
  const url = new URL(input);
  if (url.protocol !== 'https:' || url.hostname !== 'legis.senado.leg.br' || url.pathname !== '/dadosabertos/senador/lista/atual.json' || url.search || url.hash || url.username || url.password) throw new Error('Destino de integração do Senado não autorizado.');
  return url;
}

export async function fetchSenadoJson(url = SENADO_LIST_URL, options: SenadoFetchOptions = {}): Promise<unknown> {
  assertSenadoUrl(url);
  const retries = options.retries ?? 2;
  let last: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await (options.fetcher ?? fetch)(url, { headers: { Accept: 'application/json', 'User-Agent': 'CivisBR/0.1 (+official-public-data)' }, redirect: 'error', signal: AbortSignal.timeout(options.timeoutMs ?? 15000) });
      if (!response.ok) {
        const error = new Error(`Fonte Senado respondeu HTTP ${response.status}.`);
        if (response.status !== 429 && response.status < 500) throw Object.assign(error, { permanent: true });
        throw error;
      }
      const contentLength = Number(response.headers.get('content-length') || 0);
      if (contentLength > 10_000_000) throw Object.assign(new Error('Resposta do Senado excedeu o limite de segurança.'), { permanent: true });
      const body = await response.text();
      if (body.length > 10_000_000) throw Object.assign(new Error('Resposta do Senado excedeu o limite de segurança.'), { permanent: true });
      return jsonSchema.parse(JSON.parse(body));
    } catch (error) {
      last = error;
      if ((error as { permanent?: boolean }).permanent || attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.min(3000, 300 * 2 ** attempt)));
    }
  }
  throw last;
}

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const number = (value: unknown) => Number.parseInt(text(value), 10);
function citation(id: string, title: string, collectedAt: string): Citation {
  return { id, publisher: 'Senado Federal — Dados Abertos', title, url: SENADO_LIST_URL, documentId: id, eventDate: null, publishedAt: null, collectedAt, verifiedAt: collectedAt, excerpt: null, kind: 'primary', verification: 'official-import' };
}

export function parseSenadoRecords(input: unknown, limit = 100): Politician[] {
  const root = (input as { ListaParlamentarEmExercicio?: { Parlamentares?: { Parlamentar?: unknown | unknown[] } } }).ListaParlamentarEmExercicio;
  const raw = root?.Parlamentares?.Parlamentar;
  const rows = (Array.isArray(raw) ? raw : raw ? [raw] : []).slice(0, limit) as Array<Record<string, unknown>>;
  const collectedAt = new Date().toISOString();
  const records = rows.map(row => {
    const identity = (row.IdentificacaoParlamentar ?? {}) as Record<string, unknown>;
    const mandate = (row.Mandato ?? {}) as Record<string, unknown>;
    const officialId = number(identity.CodigoParlamentar);
    const name = text(identity.NomeParlamentar);
    const uf = text(identity.UfParlamentar).toUpperCase();
    const party = text(identity.SiglaPartidoParlamentar) || 'Partido não informado';
    if (!Number.isInteger(officialId) || officialId < 1 || !name || !/^[A-Z]{2}$/.test(uf)) throw new Error('Registro de senador sem ID, nome, partido ou UF válidos.');
    const start = ((mandate.PrimeiraLegislaturaDoMandato ?? {}) as Record<string, unknown>).DataInicio;
    const legislature = number(((mandate.PrimeiraLegislaturaDoMandato ?? {}) as Record<string, unknown>).NumeroLegislatura);
    const source = citation(`senado-parlamentar-${officialId}`, 'Lista de parlamentares em exercício informada pelo Senado', collectedAt);
    const timeline: TimelineEvent[] = typeof start === 'string' && /^\d{4}-\d{2}-\d{2}/.test(start) ? [{ id: `senado:${officialId}:mandato-inicio`, date: start, title: 'Início do mandato informado pelo Senado', description: 'Data de início do mandato conforme a lista corrente de parlamentares em exercício.', source }] : [];
    const officialPhoto = text(identity.UrlFotoParlamentar);
    return {
      id: `senado:${officialId}`, officialId, name, fullName: text(identity.NomeCompletoParlamentar) || null,
      party, uf, role: 'Senador(a)', municipality: null, status: 'Exercício', legislature: Number.isInteger(legislature) && legislature > 0 ? legislature : null,
      photoUrl: officialPhoto.startsWith('https://') ? officialPhoto : null, referenceDate: collectedAt.slice(0, 10), collectedAt, coverage: 'live' as const,
      education: null, source, timeline, proposals: [], legalRecords: [],
    } satisfies Politician;
  });
  if (!records.length) throw new Error('Fonte Senado retornou zero parlamentares em exercício.');
  if (new Set(records.map(record => record.officialId)).size !== records.length) throw new Error('IDs duplicados na lista corrente do Senado.');
  return records;
}

export async function collectSenado(limit = 100, options: SenadoFetchOptions = {}): Promise<Politician[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Limite do Senado deve ser um inteiro entre 1 e 100.');
  return parseSenadoRecords(await fetchSenadoJson(SENADO_LIST_URL, options), limit);
}

export async function importSenado(limit = 100, options: SenadoFetchOptions = {}) {
  const runId = beginImport(`${SENADO_LIST_URL} — parlamentares em exercício`);
  try {
    const records = await collectSenado(limit, options);
    const count = savePoliticians(records, { replaceActive: true, activePrefix: 'senado' });
    finishImport(runId, 'success', count, 'Parlamentares em exercício e mandatos correntes do Senado importados. A lista não inclui histórico eleitoral completo nem proposições.');
    return { runId, count, records };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha não identificada na importação do Senado.';
    finishImport(runId, 'failed', 0, `${message} Cache anterior preservado.`);
    throw new Error(`Importação do Senado não concluída: ${message}`, { cause: error });
  }
}

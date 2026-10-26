import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { snapshotDate, snapshotDeputado, snapshotDeputados } from "./snapshot";

const BASE = "https://dadosabertos.camara.leg.br/api/v2";
const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_RESPONSE_BYTES = 5_000_000;

const deputySummarySchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(1),
  siglaPartido: z.string().min(1),
  siglaUf: z.string().regex(/^[A-Z]{2}$/),
  urlFoto: z.string().url().nullable().optional(),
  email: z.string().email().nullable().optional(),
});

const envelopeSchema = z
  .object({
    dados: z.unknown(),
    links: z.array(z.object({ rel: z.string(), href: z.string().url() })).optional(),
  })
  .refine((value) => Object.prototype.hasOwnProperty.call(value, "dados"), {
    message: "Resposta da Câmara sem o campo dados.",
  });

export interface CamaraFetchOptions {
  fetcher?: typeof fetch;
  timeoutMs?: number;
  retries?: number;
}

export function assertCamaraUrl(input: string): URL {
  const url = new URL(input);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "dadosabertos.camara.leg.br" ||
    url.port ||
    url.username ||
    url.password ||
    !url.pathname.startsWith("/api/v2/")
  ) {
    throw new Error("Destino de integração não autorizado.");
  }
  return url;
}

async function requestWithTimeout(
  fetcher: typeof fetch,
  url: URL,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(url, {
      headers: { Accept: "application/json", "User-Agent": "Plenario/0.1 (+official-public-data)" },
      redirect: "error",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCamaraJson(
  input: string,
  options: CamaraFetchOptions = {},
): Promise<{ dados?: unknown; links?: { rel: string; href: string }[] | undefined }> {
  const url = assertCamaraUrl(input);
  const retries = options.retries ?? 1;
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await requestWithTimeout(
        options.fetcher ?? fetch,
        url,
        options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      );
      if (!res.ok) {
        const error = new Error(`Câmara API respondeu HTTP ${res.status}.`);
        if (res.status !== 429 && res.status < 500) {
          throw Object.assign(error, { permanent: true });
        }
        throw error;
      }
      const contentLength = Number(res.headers.get("content-length") ?? 0);
      if (contentLength > MAX_RESPONSE_BYTES) {
        throw Object.assign(new Error("Resposta da fonte excedeu o limite de segurança."), {
          permanent: true,
        });
      }
      const body = await res.text();
      if (body.length > MAX_RESPONSE_BYTES) {
        throw Object.assign(new Error("Resposta da fonte excedeu o limite de segurança."), {
          permanent: true,
        });
      }
      return envelopeSchema.parse(JSON.parse(body));
    } catch (e) {
      lastErr = e;
      if ((e as { permanent?: boolean }).permanent || i === retries) throw e;
      await new Promise((resolve) => setTimeout(resolve, Math.min(3_000, 300 * 2 ** i)));
    }
  }
  throw lastErr;
}

async function get<T>(path: string, options: CamaraFetchOptions = {}): Promise<T> {
  const response = await fetchCamaraJson(`${BASE}${path}`, options);
  return response.dados as T;
}

export type DeputadoResumo = {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto: string;
  email: string | null;
};

export type DeputadoDetalhe = {
  id: number;
  nomeCivil: string;
  sexo: string;
  dataNascimento: string | null;
  ufNascimento: string | null;
  municipioNascimento: string | null;
  escolaridade: string | null;
  urlWebsite: string | null;
  redeSocial: string[];
  ultimoStatus: {
    nome: string;
    nomeEleitoral: string;
    siglaPartido: string;
    siglaUf: string;
    urlFoto: string;
    idLegislatura: number;
    data: string;
    situacao: string;
    condicaoEleitoral: string;
    email: string | null;
    gabinete: { sala: string | null; predio: string | null; telefone: string | null };
  };
};

export type Despesa = {
  ano: number;
  mes: number;
  tipoDespesa: string;
  valorLiquido: number;
  nomeFornecedor: string;
  urlDocumento: string | null;
  dataDocumento: string | null;
};

export type Proposicao = {
  id: number;
  siglaTipo: string;
  numero: number;
  ano: number;
  ementa: string;
};
export type Orgao = {
  siglaOrgao: string;
  nomeOrgao: string;
  titulo: string;
  dataInicio: string;
  dataFim: string | null;
};
export type Historico = {
  dataHora: string;
  siglaPartido: string;
  siglaUf: string;
  situacao: string | null;
  condicaoEleitoral: string | null;
  descricaoStatus: string | null;
  idLegislatura: number;
};
export type Ocupacao = {
  titulo: string | null;
  entidade: string | null;
  anoInicio: number | null;
  anoFim: number | null;
};

let cachedDeputados: { dados: DeputadoResumo[]; coletadoEm: string } | null = null;

type DeputadosResponse = {
  dados: DeputadoResumo[];
  coletadoEm: string;
  stale?: boolean;
};

export const listDeputados = createServerFn({ method: "GET" }).handler(
  async (): Promise<DeputadosResponse> => {
    try {
      const raw = await get<unknown>("/deputados?ordem=ASC&ordenarPor=nome&itens=1000");
      const dados = z
        .array(deputySummarySchema)
        .parse(raw)
        .map((d) => ({ ...d, urlFoto: d.urlFoto ?? "", email: d.email ?? null }));
      const fresh = { dados, coletadoEm: new Date().toISOString() };
      cachedDeputados = fresh;
      return fresh;
    } catch (error) {
      if (cachedDeputados) {
        console.warn("Câmara indisponível; usando a última resposta válida em memória.", error);
        return { ...cachedDeputados, stale: true };
      }
      const fallback = snapshotDeputados();
      if (fallback.length > 0) {
        console.warn("Câmara indisponível; usando o snapshot oficial exportado.", error);
        return { dados: fallback, coletadoEm: snapshotDate, stale: true };
      }
      throw error;
    }
  },
);

export const getDeputado = createServerFn({ method: "GET" })
  .inputValidator((id: number) => {
    if (!Number.isInteger(id) || id <= 0) throw new Error("ID inválido");
    return id;
  })
  .handler(async ({ data: id }) => {
    try {
      const ano = new Date().getFullYear();
      const [detalhe, historico, orgaos, ocupacoes, proposicoes, despesasAno, despesasAnt] =
        await Promise.all([
          get<DeputadoDetalhe>(`/deputados/${id}`),
          get<Historico[]>(`/deputados/${id}/historico`).catch(() => []),
          get<Orgao[]>(`/deputados/${id}/orgaos?itens=100&ordem=DESC&ordenarPor=dataInicio`).catch(
            () => [],
          ),
          get<Ocupacao[]>(`/deputados/${id}/ocupacoes`).catch(() => []),
          get<Proposicao[]>(
            `/proposicoes?idDeputadoAutor=${id}&itens=30&ordem=DESC&ordenarPor=id`,
          ).catch(() => []),
          get<Despesa[]>(`/deputados/${id}/despesas?ano=${ano}&itens=100`).catch(() => []),
          get<Despesa[]>(`/deputados/${id}/despesas?ano=${ano - 1}&itens=100`).catch(() => []),
        ]);
      return {
        detalhe,
        historico,
        orgaos,
        ocupacoes,
        proposicoes,
        despesas: [...despesasAno, ...despesasAnt],
        anosDespesa: [ano, ano - 1],
        coletadoEm: new Date().toISOString(),
        stale: false,
      };
    } catch (error) {
      const fallback = snapshotDeputado(id);
      if (fallback) {
        console.warn(`Câmara indisponível; usando snapshot oficial para o deputado ${id}.`, error);
        return { ...fallback, stale: true };
      }
      throw error;
    }
  });

export const deputadosQuery = () =>
  queryOptions({
    queryKey: ["deputados"],
    queryFn: () => listDeputados(),
    staleTime: 1000 * 60 * 30,
  });

export const deputadoQuery = (id: number) =>
  queryOptions({
    queryKey: ["deputado", id],
    queryFn: () => getDeputado({ data: id }),
    staleTime: 1000 * 60 * 30,
  });

/** Collapse consecutive history rows into party-affiliation periods. */
export function partyPeriods(h: Historico[]) {
  const sorted = [...h].sort((a, b) => a.dataHora.localeCompare(b.dataHora));
  const out: { partido: string; inicio: string }[] = [];
  for (const r of sorted) {
    if (!r.siglaPartido) continue;
    if (out.at(-1)?.partido !== r.siglaPartido)
      out.push({ partido: r.siglaPartido, inicio: r.dataHora });
  }
  return out;
}

export function totalByType(d: Despesa[]) {
  const m = new Map<string, number>();
  for (const x of d) m.set(x.tipoDespesa, (m.get(x.tipoDespesa) ?? 0) + x.valorLiquido);
  return [...m.entries()]
    .map(([tipo, valor]) => ({ tipo, valor }))
    .sort((a, b) => b.valor - a.valor);
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—";

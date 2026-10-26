import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

const BASE = "https://dadosabertos.camara.leg.br/api/v2";

async function get<T>(path: string, tries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${BASE}${path}`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`Câmara API ${res.status}`);
      const json = (await res.json()) as { dados: T };
      return json.dados;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
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

export type Proposicao = { id: number; siglaTipo: string; numero: number; ano: number; ementa: string };
export type Orgao = { siglaOrgao: string; nomeOrgao: string; titulo: string; dataInicio: string; dataFim: string | null };
export type Historico = {
  dataHora: string;
  siglaPartido: string;
  siglaUf: string;
  situacao: string | null;
  condicaoEleitoral: string | null;
  descricaoStatus: string | null;
  idLegislatura: number;
};
export type Ocupacao = { titulo: string | null; entidade: string | null; anoInicio: number | null; anoFim: number | null };

export const listDeputados = createServerFn({ method: "GET" }).handler(async () => {
  const dados = await get<DeputadoResumo[]>("/deputados?ordem=ASC&ordenarPor=nome&itens=1000");
  return { dados, coletadoEm: new Date().toISOString() };
});

export const getDeputado = createServerFn({ method: "GET" })
  .inputValidator((id: number) => {
    if (!Number.isInteger(id) || id <= 0) throw new Error("ID inválido");
    return id;
  })
  .handler(async ({ data: id }) => {
    const ano = new Date().getFullYear();
    const [detalhe, historico, orgaos, ocupacoes, proposicoes, despesasAno, despesasAnt] = await Promise.all([
      get<DeputadoDetalhe>(`/deputados/${id}`),
      get<Historico[]>(`/deputados/${id}/historico`).catch(() => []),
      get<Orgao[]>(`/deputados/${id}/orgaos?itens=100&ordem=DESC&ordenarPor=dataInicio`).catch(() => []),
      get<Ocupacao[]>(`/deputados/${id}/ocupacoes`).catch(() => []),
      get<Proposicao[]>(`/proposicoes?idDeputadoAutor=${id}&itens=30&ordem=DESC&ordenarPor=id`).catch(() => []),
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
    };
  });

export const deputadosQuery = () =>
  queryOptions({ queryKey: ["deputados"], queryFn: () => listDeputados(), staleTime: 1000 * 60 * 30 });

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
    if (out.at(-1)?.partido !== r.siglaPartido) out.push({ partido: r.siglaPartido, inicio: r.dataHora });
  }
  return out;
}

export function totalByType(d: Despesa[]) {
  const m = new Map<string, number>();
  for (const x of d) m.set(x.tipoDespesa, (m.get(x.tipoDespesa) ?? 0) + x.valorLiquido);
  return [...m.entries()].map(([tipo, valor]) => ({ tipo, valor })).sort((a, b) => b.valor - a.valor);
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—");

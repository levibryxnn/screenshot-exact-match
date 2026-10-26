import snapshot from "../../data/official-snapshot.json";

import type {
  DeputadoDetalhe,
  DeputadoResumo,
  Despesa,
  Historico,
  Ocupacao,
  Orgao,
  Proposicao,
} from "./camara";

type SnapshotRecord = {
  officialId: number;
  name: string;
  fullName: string | null;
  party: string;
  uf: string;
  status: string;
  legislature: number | null;
  referenceDate: string | null;
  collectedAt: string;
  education: string | null;
  timeline: { date: string; title: string; description: string }[];
  proposals: { code: string; title: string }[];
};

const records = (snapshot as { politicians?: SnapshotRecord[] }).politicians ?? [];
const collectedAt =
  (snapshot as { metadata?: { collectedAt?: string } }).metadata?.collectedAt ??
  new Date(0).toISOString();

export const snapshotDate = collectedAt;

export function snapshotDeputados(): DeputadoResumo[] {
  return records.map((record) => ({
    id: record.officialId,
    nome: record.name,
    siglaPartido: record.party,
    siglaUf: record.uf,
    urlFoto: "",
    email: null,
  }));
}

export function snapshotDeputado(id: number): {
  detalhe: DeputadoDetalhe;
  historico: Historico[];
  orgaos: Orgao[];
  ocupacoes: Ocupacao[];
  proposicoes: Proposicao[];
  despesas: Despesa[];
  anosDespesa: number[];
  coletadoEm: string;
} | null {
  const record = records.find((item) => item.officialId === id);
  if (!record) return null;

  const historico = record.timeline.map((event) => ({
    dataHora: event.date,
    siglaPartido: record.party,
    siglaUf: record.uf,
    situacao: record.status,
    condicaoEleitoral: null,
    descricaoStatus: event.description || event.title,
    idLegislatura: record.legislature ?? 0,
  }));

  const proposicoes = record.proposals.map((proposal, index) => {
    const match = /^(\S+)\s+(\d+)\/(\d+)$/.exec(proposal.code);
    return {
      id: Number(`${id}${index}`),
      siglaTipo: match?.[1] ?? "",
      numero: Number(match?.[2] ?? 0),
      ano: Number(match?.[3] ?? 0),
      ementa: proposal.title,
    };
  });

  return {
    detalhe: {
      id,
      nomeCivil: record.fullName ?? record.name,
      sexo: "",
      dataNascimento: null,
      ufNascimento: null,
      municipioNascimento: null,
      escolaridade: record.education,
      urlWebsite: null,
      redeSocial: [],
      ultimoStatus: {
        nome: record.name,
        nomeEleitoral: record.name,
        siglaPartido: record.party,
        siglaUf: record.uf,
        urlFoto: "",
        idLegislatura: record.legislature ?? 0,
        data: record.referenceDate ?? record.collectedAt,
        situacao: record.status,
        condicaoEleitoral: "",
        email: null,
        gabinete: { sala: null, predio: null, telefone: null },
      },
    },
    historico,
    orgaos: [],
    ocupacoes: [],
    proposicoes,
    despesas: [],
    anosDespesa: [new Date().getFullYear(), new Date().getFullYear() - 1],
    coletadoEm: record.collectedAt || collectedAt,
  };
}

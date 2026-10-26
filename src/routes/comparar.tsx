import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { brl, deputadoQuery, deputadosQuery, fmtDate } from "@/lib/camara";

type S = { a?: number; b?: number };

export const Route = createFileRoute("/comparar")({
  validateSearch: (s: Record<string, unknown>): S => ({
    a: Number(s.a) > 0 ? Number(s.a) : undefined,
    b: Number(s.b) > 0 ? Number(s.b) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Comparar parlamentares | Plenário" },
      { name: "description", content: "Compare lado a lado dados oficiais de dois deputados federais." },
      { property: "og:title", content: "Comparar parlamentares | Plenário" },
      { property: "og:description", content: "Comparação lado a lado com os mesmos critérios para todos." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(deputadosQuery()),
  component: Comparar,
});

function Comparar() {
  const { a, b } = Route.useSearch();
  const nav = useNavigate({ from: "/comparar" });
  const { data } = useSuspenseQuery(deputadosQuery());
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl font-bold">Comparar</h1>
      <p className="mt-1 text-sm text-muted-foreground">Mesmos campos, mesmas fontes, para ambos os lados.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(["a", "b"] as const).map((k) => {
          const v = k === "a" ? a : b;
          return (
            <div key={k} className="space-y-3">
              <select
                aria-label={`Parlamentar ${k.toUpperCase()}`}
                value={v ?? ""}
                onChange={(e) => nav({ search: (p) => ({ ...p, [k]: Number(e.target.value) || undefined }) })}
                className="w-full rounded border border-input bg-panel px-3 py-2 text-sm"
              >
                <option value="">Selecione…</option>
                {data.dados.map((d) => <option key={d.id} value={d.id}>{d.nome} ({d.siglaPartido}-{d.siglaUf})</option>)}
              </select>
              {v ? <Coluna id={v} /> : <div className="grid h-64 place-items-center rounded border border-dashed border-border text-muted-foreground">Vazio</div>}
            </div>
          );
        })}
      </div>
    </main>
  );
}

function Coluna({ id }: { id: number }) {
  const { data, isLoading, isError } = useQuery(deputadoQuery(id));
  if (isLoading) return <div className="h-64 animate-pulse rounded bg-card" />;
  if (isError || !data) return <p className="text-sm text-destructive">Falha ao consultar a Câmara.</p>;
  const s = data.detalhe.ultimoStatus;
  const rows: [string, string][] = [
    ["Partido / UF", `${s.siglaPartido} · ${s.siglaUf}`],
    ["Situação", s.situacao ?? "—"],
    ["Nascimento", fmtDate(data.detalhe.dataNascimento)],
    ["Escolaridade declarada", data.detalhe.escolaridade ?? "—"],
    ["Proposições (últimas 30 retornadas)", String(data.proposicoes.length)],
    ["Órgãos/comissões registrados", String(data.orgaos.length)],
    [`Cota ${data.anosDespesa.join("+")} (amostra)`, brl(data.despesas.reduce((t, x) => t + x.valorLiquido, 0))],
  ];
  return (
    <div className="animate-rise rounded border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <img src={s.urlFoto} alt="" className="h-20 w-16 rounded-sm object-cover" />
        <div>
          <p className="font-display text-xl font-bold">{s.nome}</p>
          <Link to="/deputado/$id" params={{ id: String(id) }} className="text-xs text-signal underline">Ficha completa</Link>
        </div>
      </div>
      <dl className="mt-4 divide-y divide-border text-sm">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-mono">{v}</dd></div>)}
      </dl>
    </div>
  );
}

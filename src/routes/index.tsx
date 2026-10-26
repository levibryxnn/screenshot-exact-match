import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, ArrowRight, GitCompare } from "lucide-react";
import { deputadosQuery, fmtDate, type DeputadoResumo } from "@/lib/camara";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Plenário — Escolha um parlamentar" },
      { name: "description", content: "Pesquise os 513 deputados federais em exercício e abra fichas com dados oficiais da Câmara." },
      { property: "og:title", content: "Plenário — Escolha um parlamentar" },
      { property: "og:description", content: "Transparência política com dados oficiais, sem rankings nem recomendações de voto." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(deputadosQuery()),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(deputadosQuery());
  const [q, setQ] = useState("");
  const [uf, setUf] = useState("");
  const [partido, setPartido] = useState("");
  const [selId, setSelId] = useState<number | null>(null);

  const ufs = useMemo(() => [...new Set(data.dados.map((d) => d.siglaUf))].sort(), [data]);
  const partidos = useMemo(() => [...new Set(data.dados.map((d) => d.siglaPartido))].sort(), [data]);
  const list = useMemo(() => {
    const n = q.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    return data.dados.filter(
      (d) =>
        (!uf || d.siglaUf === uf) &&
        (!partido || d.siglaPartido === partido) &&
        (!n || d.nome.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().includes(n)),
    );
  }, [data, q, uf, partido]);
  const sel = list.find((d) => d.id === selId) ?? list[0];

  const select = "rounded border border-input bg-panel px-3 py-2 text-sm";
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-signal">Câmara dos Deputados · em exercício</p>
          <h1 className="mt-1 text-4xl font-bold md:text-5xl">Escolha um parlamentar</h1>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {data.dados.length} registros · coletado {fmtDate(data.coletadoEm)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {sel ? <Spotlight d={sel} /> : <div className="rounded border border-border p-6 text-muted-foreground">Nenhum resultado.</div>}

        <section aria-label="Grade de parlamentares">
          <div className="mb-4 flex flex-wrap gap-2">
            <label className="relative flex-1 min-w-[200px]">
              <span className="sr-only">Buscar por nome</span>
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome…" className={`${select} w-full pl-9`} />
            </label>
            <select aria-label="Estado" value={uf} onChange={(e) => setUf(e.target.value)} className={select}>
              <option value="">Todos os estados</option>
              {ufs.map((u) => <option key={u}>{u}</option>)}
            </select>
            <select aria-label="Partido" value={partido} onChange={(e) => setPartido(e.target.value)} className={select}>
              <option value="">Todos os partidos</option>
              {partidos.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <p className="mb-3 font-mono text-xs text-muted-foreground">{list.length} exibidos · ordem alfabética</p>
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-10">
            {list.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => setSelId(d.id)}
                  onMouseEnter={() => setSelId(d.id)}
                  aria-pressed={sel?.id === d.id}
                  aria-label={`${d.nome}, ${d.siglaPartido}-${d.siglaUf}`}
                  className={`group relative block w-full overflow-hidden rounded-sm border bg-panel transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none ${
                    sel?.id === d.id ? "glow border-signal" : "border-border opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={d.urlFoto} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover grayscale-[40%] transition group-hover:grayscale-0" />
                  <span className="absolute inset-x-0 bottom-0 bg-panel/85 px-1 py-0.5 text-center font-mono text-[10px]">{d.siglaUf}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function Spotlight({ d }: { d: DeputadoResumo }) {
  return (
    <aside key={d.id} className="animate-rise clip-corner self-start border border-border bg-card lg:sticky lg:top-20">
      <div className="scanline relative overflow-hidden bg-panel">
        <img src={d.urlFoto} alt={`Foto oficial de ${d.nome}`} className="mx-auto aspect-[3/4] h-80 object-cover" />
      </div>
      <div className="space-y-4 p-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-signal">Deputado(a) Federal</p>
          <h2 className="text-3xl font-bold">{d.nome}</h2>
        </div>
        <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
          <div className="rounded border border-border p-2"><dt className="text-xs text-muted-foreground">Partido</dt><dd>{d.siglaPartido}</dd></div>
          <div className="rounded border border-border p-2"><dt className="text-xs text-muted-foreground">UF</dt><dd>{d.siglaUf}</dd></div>
        </dl>
        <div className="flex gap-2">
          <Link to="/deputado/$id" params={{ id: String(d.id) }} className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-primary px-4 py-2.5 font-display font-semibold text-primary-foreground hover:opacity-90">
            Ficha completa <ArrowRight className="size-4" />
          </Link>
          <Link to="/comparar" search={{ a: d.id }} className="inline-flex items-center gap-2 rounded border border-border px-3 py-2.5 text-sm hover:bg-accent" aria-label="Comparar">
            <GitCompare className="size-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

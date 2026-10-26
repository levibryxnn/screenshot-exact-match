import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { brl, deputadoQuery, fmtDate, partyPeriods, totalByType } from "@/lib/camara";
import { LEGAL_STATUSES } from "@/lib/legal";
import { SourceLink } from "@/components/SourceLink";

export const Route = createFileRoute("/deputado/$id")({
  loader: async ({ context, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    const d = await context.queryClient.ensureQueryData(deputadoQuery(id));
    return { nome: d.detalhe.ultimoStatus.nome, foto: d.detalhe.ultimoStatus.urlFoto };
  },
  head: ({ loaderData }) => {
    const t = `${loaderData?.nome ?? "Parlamentar"} — Ficha | Plenário`;
    const desc = `Trajetória, proposições, comissões e despesas de ${loaderData?.nome ?? "parlamentar"} com fontes oficiais.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: desc },
        { property: "og:title", content: t },
        { property: "og:description", content: desc },
        ...(loaderData?.foto
          ? [
              { property: "og:image", content: loaderData.foto },
              { name: "twitter:image", content: loaderData.foto },
            ]
          : []),
      ],
    };
  },
  component: Ficha,
  errorComponent: () => (
    <p className="p-10 text-center text-muted-foreground">
      Não foi possível consultar a Câmara agora. Tente novamente.
    </p>
  ),
});

const camaraUrl = (id: number) => `https://www.camara.leg.br/deputados/${id}`;

function Section({
  id,
  title,
  source,
  children,
}: {
  id: string;
  title: string;
  source?: { label: string; href: string };
  children: ReactNode;
}) {
  return (
    <section id={id} className="animate-rise scroll-mt-24 rounded border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        {source && <SourceLink href={source.href} label={`Fonte: ${source.label}`} />}
      </div>
      {children}
    </section>
  );
}

function Ficha() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(deputadoQuery(Number(id)));
  const {
    detalhe: d,
    historico,
    orgaos,
    ocupacoes,
    proposicoes,
    despesas,
    anosDespesa,
    coletadoEm,
    stale,
  } = data;
  const s = d.ultimoStatus;
  const periods = partyPeriods(historico);
  const porTipo = totalByType(despesas).slice(0, 8);
  const total = despesas.reduce((a, x) => a + x.valorLiquido, 0);

  const sections = [
    ["identificacao", "Identificação"],
    ["trajetoria", "Trajetória"],
    ["proposicoes", "Proposições"],
    ["comissoes", "Comissões"],
    ["despesas", "Despesas"],
    ["processos", "Processos"],
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Link to="/" className="font-mono text-xs text-muted-foreground hover:text-foreground">
        ← Voltar à seleção
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {s.urlFoto ? (
            <img
              src={s.urlFoto}
              alt={`Foto oficial de ${s.nome}`}
              className="clip-corner glow w-full max-w-[280px]"
            />
          ) : (
            <div
              className="clip-corner glow grid aspect-[3/4] w-full max-w-[280px] place-items-center bg-accent font-display text-8xl text-muted-foreground"
              aria-label={`Foto oficial de ${s.nome} não disponível`}
            >
              {s.nome.slice(0, 1)}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{s.nome}</h1>
            <p className="font-mono text-sm text-signal">
              {s.siglaPartido} · {s.siglaUf}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {s.situacao ?? "—"} · {s.condicaoEleitoral}
            </p>
          </div>
          <nav aria-label="Seções" className="hidden flex-col gap-1 lg:flex">
            {sections.map(([k, l]) => (
              <a
                key={k}
                href={`#${k}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {l}
              </a>
            ))}
          </nav>
          <p className="font-mono text-[11px] text-muted-foreground">
            Situação de referência: {fmtDate(s.data)}
            <br />
            Coletado: {new Date(coletadoEm).toLocaleString("pt-BR")}
          </p>
          {stale && (
            <p role="status" className="text-xs text-signal">
              Fonte indisponível; exibindo snapshot oficial ou última resposta válida.
            </p>
          )}
        </aside>

        <div className="space-y-5">
          <Section
            id="identificacao"
            title="Identificação"
            source={{
              label: "Câmara /deputados/{id}",
              href: `https://dadosabertos.camara.leg.br/api/v2/deputados/${id}`,
            }}
          >
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              {[
                ["Nome civil", d.nomeCivil],
                ["Nome eleitoral", s.nomeEleitoral],
                [
                  "Nascimento",
                  `${fmtDate(d.dataNascimento)} · ${d.municipioNascimento ?? "—"}/${d.ufNascimento ?? "—"}`,
                ],
                ["Escolaridade declarada", d.escolaridade ?? "—"],
                ["Legislatura", String(s.idLegislatura)],
                ["Situação", s.situacao ?? "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {ocupacoes.filter((o) => o.titulo).length > 0 && (
              <div className="mt-4">
                <h3 className="mb-1 text-sm font-semibold">Ocupações declaradas</h3>
                <ul className="text-sm text-muted-foreground">
                  {ocupacoes
                    .filter((o) => o.titulo)
                    .map((o, i) => (
                      <li key={i}>
                        {o.titulo}
                        {o.entidade ? ` — ${o.entidade}` : ""}
                        {o.anoInicio ? ` (${o.anoInicio}${o.anoFim ? `–${o.anoFim}` : ""})` : ""}
                      </li>
                    ))}
                </ul>
              </div>
            )}
            <a
              href={camaraUrl(d.id)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm text-signal underline"
            >
              Página oficial na Câmara <ExternalLink className="size-3" />
            </a>
          </Section>

          <Section
            id="trajetoria"
            title="Trajetória na Câmara"
            source={{
              label: "Câmara /deputados/{id}/historico",
              href: `https://dadosabertos.camara.leg.br/api/v2/deputados/${id}/historico`,
            }}
          >
            {periods.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem histórico disponível.</p>
            ) : (
              <ol className="relative ml-2 border-l border-border">
                {periods.map((p, i) => (
                  <li key={i} className="mb-4 ml-4">
                    <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-signal" />
                    <p className="font-mono text-xs text-muted-foreground">{fmtDate(p.inicio)}</p>
                    <p className="text-sm">
                      Registro com filiação <strong>{p.partido}</strong>
                    </p>
                  </li>
                ))}
              </ol>
            )}
            <p className="text-xs text-muted-foreground">
              Mostra apenas registros da Câmara. Candidaturas e mandatos em outras esferas virão da
              integração com o TSE.
            </p>
          </Section>

          <Section
            id="proposicoes"
            title="Proposições de autoria"
            source={{
              label: "Câmara /proposicoes?idDeputadoAutor",
              href: `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${id}`,
            }}
          >
            <p className="mb-3 text-xs text-muted-foreground">
              Autoria ou coautoria de uma proposição não significa aprovação nem implementação.
            </p>
            {proposicoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma proposição retornada.</p>
            ) : (
              <ul className="divide-y divide-border">
                {proposicoes.map((p) => (
                  <li key={p.id} className="py-2 text-sm">
                    <a
                      href={`https://www.camara.leg.br/propostas-legislativas/${p.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-signal hover:underline"
                    >
                      {p.siglaTipo} {p.numero}/{p.ano}
                    </a>
                    <span className="ml-2 text-muted-foreground">{p.ementa}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            id="comissoes"
            title="Comissões e órgãos"
            source={{
              label: "Câmara /deputados/{id}/orgaos",
              href: `https://dadosabertos.camara.leg.br/api/v2/deputados/${id}/orgaos`,
            }}
          >
            {orgaos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {orgaos.slice(0, 20).map((o, i) => (
                  <li key={i} className="rounded border border-border p-2 text-sm">
                    <p className="font-mono text-xs text-signal">
                      {o.siglaOrgao} · {o.titulo}
                    </p>
                    <p className="line-clamp-2">{o.nomeOrgao}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {fmtDate(o.dataInicio)} – {o.dataFim ? fmtDate(o.dataFim) : "atual"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            id="despesas"
            title={`Cota parlamentar (${anosDespesa.join(", ")})`}
            source={{
              label: "Câmara /deputados/{id}/despesas",
              href: `https://dadosabertos.camara.leg.br/api/v2/deputados/${id}/despesas`,
            }}
          >
            <p className="mb-3 text-sm">
              Total nas primeiras 100 notas de cada ano:{" "}
              <strong className="font-mono">{brl(total)}</strong>
            </p>
            {porTipo.length > 0 && (
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={porTipo} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="tipo"
                      width={180}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    />
                    <Tooltip
                      formatter={(v: number) => brl(v)}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                      }}
                    />
                    <Bar dataKey="valor" fill="var(--chart-1)" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Gastos com a cota são legais quando dentro das regras; valores altos não indicam
              irregularidade por si só. Amostra limitada — veja a fonte para o total.
            </p>
          </Section>

          <Section id="processos" title="Investigações, acusações e processos">
            <p className="text-sm">
              Nenhum caso foi publicado nesta ficha. Casos só entram após verificação em documentos
              oficiais (tribunais, MP, DataJud) e revisão humana — nunca a partir de notícias
              isoladas ou IA.
            </p>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-signal">
                Como os casos serão classificados
              </summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                {LEGAL_STATUSES.map((l) => (
                  <li key={l.key}>
                    <strong className="text-foreground">{l.label}:</strong> {l.desc}
                  </li>
                ))}
              </ol>
            </details>
          </Section>
        </div>
      </div>
    </main>
  );
}

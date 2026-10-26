import { createFileRoute } from "@tanstack/react-router";
import { LEGAL_STATUSES } from "@/lib/legal";

export const Route = createFileRoute("/metodologia")({
  head: () => ({
    meta: [
      { title: "Metodologia e independência | Plenário" },
      { name: "description", content: "Critérios públicos de fontes, classificação jurídica e imparcialidade da plataforma." },
      { property: "og:title", content: "Metodologia e independência | Plenário" },
      { property: "og:description", content: "Como coletamos, verificamos e apresentamos informações sobre políticos." },
    ],
  }),
  component: Metodologia,
});

function Metodologia() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 leading-relaxed">
      <h1 className="text-4xl font-bold">Metodologia</h1>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Independência</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Os mesmos campos e fontes são aplicados a todos, de qualquer partido ou corrente.</li>
          <li>Não há rankings de honestidade, notas morais nem recomendação de voto.</li>
          <li>A ordem de exibição é alfabética; cores de partidos não são usadas na interface.</li>
          <li>Fato e opinião são separados; reportagens não substituem decisões oficiais.</li>
        </ul>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Fontes atualmente integradas</h2>
        <p className="text-muted-foreground">API de Dados Abertos da Câmara dos Deputados (consulta ao vivo, com cache de 30 minutos e repetição automática em falhas). Cada ficha mostra a data de referência e a data da coleta. Próximas: Senado Federal, TSE (candidaturas, bens, contas), DataJud/CNJ e Portal da Transparência.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Classificação de casos jurídicos</h2>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          {LEGAL_STATUSES.map((l) => <li key={l.key}><strong className="text-foreground">{l.label}</strong> — {l.desc}</li>)}
        </ol>
        <p className="mt-2 text-sm text-muted-foreground">Nenhum caso é publicado automaticamente por IA. Absolvições e arquivamentos têm o mesmo destaque que acusações.</p>
      </section>
    </main>
  );
}

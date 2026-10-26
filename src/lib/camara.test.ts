import { describe, it, expect } from "vitest";
import { assertCamaraUrl, fetchCamaraJson, partyPeriods, totalByType } from "./camara";

describe("integração Câmara", () => {
  it("aceita somente endpoints HTTPS oficiais da API", () => {
    expect(assertCamaraUrl("https://dadosabertos.camara.leg.br/api/v2/deputados").hostname).toBe(
      "dadosabertos.camara.leg.br",
    );
    expect(() => assertCamaraUrl("https://example.com/api/v2/deputados")).toThrow(
      "Destino de integração não autorizado",
    );
    expect(() => assertCamaraUrl("http://dadosabertos.camara.leg.br/api/v2/deputados")).toThrow(
      "Destino de integração não autorizado",
    );
  });

  it("rejeita envelopes inválidos antes de repassar dados à interface", async () => {
    const fetcher: typeof fetch = async () =>
      new Response(JSON.stringify({ resultado: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    await expect(
      fetchCamaraJson("https://dadosabertos.camara.leg.br/api/v2/deputados", {
        fetcher,
        retries: 0,
      }),
    ).rejects.toThrow();
  });
});

describe("partyPeriods", () => {
  it("records each party change once, in date order", () => {
    const h = [
      { dataHora: "2020-01-01", siglaPartido: "B" },
      { dataHora: "2019-01-01", siglaPartido: "A" },
      { dataHora: "2019-06-01", siglaPartido: "A" },
    ] as never;
    expect(partyPeriods(h).map((p) => p.partido)).toEqual(["A", "B"]);
  });
});

describe("totalByType", () => {
  it("sums expenses per type, largest first", () => {
    const d = [
      { tipoDespesa: "X", valorLiquido: 10 },
      { tipoDespesa: "Y", valorLiquido: 50 },
      { tipoDespesa: "X", valorLiquido: 5 },
    ] as never;
    expect(totalByType(d)).toEqual([
      { tipo: "Y", valor: 50 },
      { tipo: "X", valor: 15 },
    ]);
  });
});

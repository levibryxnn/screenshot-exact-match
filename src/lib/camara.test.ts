import { describe, it, expect } from "vitest";
import { partyPeriods, totalByType } from "./camara";

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

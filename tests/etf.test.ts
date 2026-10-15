import { describe, expect, it } from "vitest";
import { calculateETF, calculateETFScenarios, monthlyRateFromAnnual } from "@/lib/etf/calculateETF";
import type { ETFInput, ETFScenario } from "@/lib/etf/etfTypes";

const base: ETFInput = {
  capitaleIniziale: 0,
  versamentoMensile: 100,
  anniVersamento: 10,
  anniOrizzonte: 10,
  costoAnnuo: 0,
  commissione: 0,
  inflazione: 0,
  incrementoVersamento: 0,
  etaIniziale: 30,
  annoIniziale: 2026,
};
const scenario = (r: number): ETFScenario => ({ id: "centrale", nome: "Centrale", rendimento: r });

describe("calculateETF", () => {
  it("rendimento mensile equivalente: (1 + r)^(1/12) − 1 ricompone il tasso annuo", () => {
    const rm = monthlyRateFromAnnual(0.05);
    expect(Math.pow(1 + rm, 12) - 1).toBeCloseTo(0.05, 12);
  });

  it("1. versamento pari a zero e nessun capitale: tutto resta a zero", () => {
    const out = calculateETF({ ...base, versamentoMensile: 0 }, scenario(0.05));
    expect(out.errori).toHaveLength(0);
    expect(out.risultato?.capitaleFinale).toBe(0);
    expect(out.risultato?.versamentiTotali).toBe(0);
  });

  it("2. rendimento pari a zero e nessun costo: capitale = somma dei versamenti", () => {
    const out = calculateETF(base, scenario(0));
    expect(out.risultato?.capitaleFinale).toBeCloseTo(100 * 12 * 10, 6);
    expect(out.risultato?.rendimentoLordoTotale).toBeCloseTo(0, 6);
  });

  it("3. costi superiori al rendimento: il capitale finale è inferiore ai versamenti e viene segnalato", () => {
    const out = calculateETF({ ...base, costoAnnuo: 0.03 }, scenario(0.01));
    expect(out.risultato!.capitaleFinale).toBeLessThan(out.risultato!.totaleInvestito);
    expect(out.risultato!.sottoInvestito).toBe(true);
    expect(out.avvisi.some((a) => a.includes("costi"))).toBe(true);
    expect(out.risultato!.costiTotali).toBeGreaterThan(0);
  });

  it("4. capitale iniziale senza nuovi versamenti: C·(1 + r)^n (caso matematico verificabile)", () => {
    const out = calculateETF({ ...base, capitaleIniziale: 10_000, versamentoMensile: 0 }, scenario(0.05));
    expect(out.risultato!.capitaleFinale).toBeCloseTo(10_000 * Math.pow(1.05, 10), 6);
  });

  it("il calcolo iterativo coincide con la formula della rendita anticipata", () => {
    const r = 0.06;
    const rm = monthlyRateFromAnnual(r);
    const n = 120;
    const P = 100;
    const atteso = P * ((Math.pow(1 + rm, n) - 1) / rm) * (1 + rm);
    const out = calculateETF(base, scenario(r));
    expect(out.risultato!.capitaleFinale).toBeCloseTo(atteso, 6);
  });

  it("separa crescita lorda e costi: capitale = investito + crescita − costi", () => {
    const out = calculateETF({ ...base, capitaleIniziale: 2000, costoAnnuo: 0.004, commissione: 1.5 }, scenario(0.05));
    const res = out.risultato!;
    expect(res.capitaleFinale).toBeCloseTo(res.totaleInvestito + res.rendimentoLordoTotale - res.costiTotali, 6);
    expect(res.commissioniTotali).toBeCloseTo(1.5 * 120, 6);
  });

  it("restituisce una riga per anno con valori reali ridotti dall'inflazione", () => {
    const out = calculateETF({ ...base, inflazione: 0.02 }, scenario(0.04));
    expect(out.dettaglio).toHaveLength(10);
    const last = out.dettaglio[9];
    expect(last.capitaleFinaleReale).toBeCloseTo(last.capitaleFinale / Math.pow(1.02, 10), 6);
    expect(last.versamentiCumulati).toBeCloseTo(12_000, 6);
  });

  it("anni pari a zero producono un errore", () => {
    const out = calculateETF({ ...base, anniOrizzonte: 0 }, scenario(0.04));
    expect(out.risultato).toBeNull();
    expect(out.errori.length).toBeGreaterThan(0);
  });

  it("gli scenari prudente e favorevole circondano quello centrale", () => {
    const s = calculateETFScenarios(base, 0.04, { prudente: -0.02, favorevole: 0.02 });
    expect(s.prudente.risultato!.capitaleFinale).toBeLessThan(s.centrale.risultato!.capitaleFinale);
    expect(s.favorevole.risultato!.capitaleFinale).toBeGreaterThan(s.centrale.risultato!.capitaleFinale);
    expect(s.prudente.risultato!.scenario.rendimento).toBeCloseTo(0.02, 10);
  });

  it("l'incremento annuo del versamento aumenta i versamenti dal secondo anno", () => {
    const out = calculateETF({ ...base, anniVersamento: 2, anniOrizzonte: 2, incrementoVersamento: 0.1 }, scenario(0));
    expect(out.dettaglio[0].versamentiAnno).toBeCloseTo(1200, 6);
    expect(out.dettaglio[1].versamentiAnno).toBeCloseTo(1320, 6);
  });
});

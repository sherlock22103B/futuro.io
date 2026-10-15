import { describe, expect, it } from "vitest";
import { calculateNominalValue, calculateRealValue } from "@/lib/inflation/calculateRealValue";
import { calculateRetirementIncome } from "@/lib/retirement/calculateRetirementIncome";

describe("8. conversione da nominale a reale", () => {
  it("sconta il valore per l'inflazione composta", () => {
    expect(calculateRealValue(1000, 0.02, 10)).toBeCloseTo(1000 / Math.pow(1.02, 10), 10);
    expect(calculateRealValue(1000, 0.02, 0)).toBe(1000);
    expect(calculateRealValue(1000, 0, 30)).toBe(1000);
  });

  it("nominale e reale sono operazioni inverse", () => {
    const real = calculateRealValue(5000, 0.03, 25);
    expect(calculateNominalValue(real, 0.03, 25)).toBeCloseTo(5000, 8);
  });
});

describe("calculateRetirementIncome", () => {
  it("prelievo per N anni senza rendimento: capitale ÷ mesi", () => {
    const r = calculateRetirementIncome(120_000, { modalita: "anni", anni: 20, percentuale: 0, rendimento: 0 });
    expect(r.prelievoMensile).toBeCloseTo(500, 8);
  });

  it("prelievo per N anni con rendimento: rata che esaurisce il capitale", () => {
    const r = calculateRetirementIncome(100_000, { modalita: "anni", anni: 10, percentuale: 0, rendimento: 0.03 });
    const i = Math.pow(1.03, 1 / 12) - 1;
    // Il valore attuale delle rate deve essere pari al capitale
    let pv = 0;
    for (let k = 1; k <= 120; k++) pv += r.prelievoMensile / Math.pow(1 + i, k);
    expect(pv).toBeCloseTo(100_000, 4);
  });

  it("percentuale annua: quota fissa del capitale", () => {
    const r = calculateRetirementIncome(100_000, { modalita: "percentuale", anni: 0, percentuale: 0.04, rendimento: 0 });
    expect(r.prelievoAnnuo).toBeCloseTo(4000, 8);
    expect(r.durataAnni).toBeCloseTo(25, 8);
  });

  it("nessuna conversione: reddito pari a zero", () => {
    const r = calculateRetirementIncome(100_000, { modalita: "nessuna", anni: 0, percentuale: 0, rendimento: 0 });
    expect(r.prelievoMensile).toBe(0);
  });
});

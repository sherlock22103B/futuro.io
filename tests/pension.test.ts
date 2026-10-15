import { describe, expect, it } from "vitest";
import { calculatePension, estimatePastMontante, toPensionEngineParameters } from "@/lib/pension/calculatePension";
import type { PensionEngineParameters, PensionInput } from "@/lib/pension/pensionTypes";
import { pensionParameters } from "@/config/pensionParameters";

const params: PensionEngineParameters = {
  coefficienti: { 64: 0.05, 65: 0.052, 66: 0.054, 67: 0.056 },
  mensilita: 13,
  coefficientiDemo: false,
};

const base: PensionInput = {
  etaAttuale: 30,
  annoCorrente: 2026,
  etaPensionamento: 67,
  stipendioAnnuo: 30_000,
  crescitaStipendio: 0,
  aliquota: 0.33,
  montanteIniziale: 0,
  anniContributiPassati: 0,
  rivalutazione: 0,
  rivalutaInPausa: true,
  anniLavoroFuturi: 37,
  etaSenzaContributi: [],
  coefficienteOverride: null,
  inflazione: 0,
};

describe("calculatePension", () => {
  it("calcola anno per anno con la struttura contributiva", () => {
    const out = calculatePension(base, params);
    expect(out.errori).toHaveLength(0);
    expect(out.dettaglio).toHaveLength(37);
    const montante = 30_000 * 0.33 * 37;
    expect(out.risultato!.montanteFinale).toBeCloseTo(montante, 6);
    expect(out.risultato!.pensioneAnnuaLorda).toBeCloseTo(montante * 0.056, 6);
    expect(out.risultato!.pensioneMensileLorda).toBeCloseTo((montante * 0.056) / 13, 6);
  });

  it("memorizza per ogni anno età, anno, stipendio, contributi e montanti", () => {
    const out = calculatePension({ ...base, montanteIniziale: 1000, rivalutazione: 0.02 }, params);
    const first = out.dettaglio[0];
    expect(first).toMatchObject({ eta: 30, anno: 2026, stipendio: 30_000, montanteIniziale: 1000 });
    expect(first.rivalutazione).toBeCloseTo(20, 6);
    expect(first.contributi).toBeCloseTo(9900, 6);
    expect(first.montanteFinale).toBeCloseTo(1000 + 20 + 9900, 6);
    expect(out.dettaglio[1].montanteIniziale).toBeCloseTo(first.montanteFinale, 6);
  });

  it("5. anni senza contributi: stipendio e contributi azzerati, anno evidenziato", () => {
    const out = calculatePension({ ...base, etaSenzaContributi: [40, 41] }, params);
    const gap = out.dettaglio.filter((r) => r.senzaContributi);
    expect(gap.map((r) => r.eta)).toEqual([40, 41]);
    expect(gap.every((r) => r.contributi === 0 && r.stipendio === 0)).toBe(true);
    expect(out.risultato!.montanteFinale).toBeCloseTo(30_000 * 0.33 * 35, 6);
    expect(out.risultato!.anniSenzaContributi).toBe(2);
  });

  it("negli anni senza contributi la rivalutazione è configurabile", () => {
    const withRev = calculatePension({ ...base, montanteIniziale: 10_000, rivalutazione: 0.02, etaSenzaContributi: [30] }, params);
    const noRev = calculatePension(
      { ...base, montanteIniziale: 10_000, rivalutazione: 0.02, etaSenzaContributi: [30], rivalutaInPausa: false },
      params,
    );
    expect(withRev.dettaglio[0].rivalutazione).toBeCloseTo(200, 6);
    expect(noRev.dettaglio[0].rivalutazione).toBe(0);
  });

  it("6. montante iniziale pari a zero: parte da zero senza stime", () => {
    const out = calculatePension({ ...base, montanteIniziale: 0, anniContributiPassati: 10 }, params);
    expect(out.risultato!.montanteIniziale).toBe(0);
    expect(out.risultato!.montanteStimato).toBe(false);
  });

  it("montante sconosciuto: viene stimato e segnalato", () => {
    const out = calculatePension({ ...base, montanteIniziale: null, anniContributiPassati: 5 }, params);
    expect(out.risultato!.montanteStimato).toBe(true);
    expect(out.risultato!.montanteIniziale).toBeCloseTo(30_000 * 0.33 * 5, 6);
    expect(out.avvisi.some((a) => a.includes("stimato"))).toBe(true);
    expect(estimatePastMontante({ ...base, anniContributiPassati: 0 })).toBe(0);
  });

  it("7. cambiando l'età pensionabile cambiano anni, montante e coefficiente", () => {
    const a = calculatePension({ ...base, etaPensionamento: 65, anniLavoroFuturi: 35 }, params);
    const b = calculatePension(base, params);
    expect(a.dettaglio).toHaveLength(35);
    expect(a.risultato!.coefficiente).toBeCloseTo(0.052, 10);
    expect(b.risultato!.coefficiente).toBeCloseTo(0.056, 10);
    expect(b.risultato!.pensioneAnnuaLorda).toBeGreaterThan(a.risultato!.pensioneAnnuaLorda);
  });

  it("età fuori tabella: usa il coefficiente più vicino e avvisa", () => {
    const out = calculatePension({ ...base, etaPensionamento: 70, anniLavoroFuturi: 40 }, params);
    expect(out.risultato!.etaCoefficiente).toBe(67);
    expect(out.avvisi.some((a) => a.includes("70 anni"))).toBe(true);
  });

  it("errore se l'età pensionabile non supera l'età attuale", () => {
    const out = calculatePension({ ...base, etaPensionamento: 30 }, params);
    expect(out.risultato).toBeNull();
    expect(out.errori.length).toBeGreaterThan(0);
  });

  it("usa i parametri del file di configurazione, marcati come demo", () => {
    const p = toPensionEngineParameters(pensionParameters);
    expect(p.coefficientiDemo).toBe(true);
    expect(p.coefficienti[67]).toBeCloseTo(pensionParameters.coefficientiTrasformazione.valore[67] / 100, 10);
    const out = calculatePension(base, p);
    expect(out.avvisi.some((a) => a.includes("VALORE DEMO"))).toBe(true);
  });

  it("il coefficiente inserito dall'utente ha la precedenza", () => {
    const out = calculatePension({ ...base, coefficienteOverride: 0.06 }, params);
    expect(out.risultato!.coefficiente).toBe(0.06);
    expect(out.risultato!.coefficienteFonte).toBe("utente");
  });
});

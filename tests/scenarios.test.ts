import { describe, expect, it } from "vitest";
import { applyWhatIf, compareScenarios, getEtaUtilizzo, runSimulation } from "@/lib/scenarios/calculateScenarios";
import { AUTO_VALUES, buildDemoInput } from "@/config/simulationDefaults";
import { getPlatform } from "@/config/investmentPlatforms";
import { getConfiguredRate } from "@/config/pensionParameters";
import { computeCompleteness } from "@/lib/scenarios/completeness";
import type { SimulationInput } from "@/lib/validation/schemas";

const now = new Date("2026-10-14T10:00:00Z");

describe("runSimulation", () => {
  it("produce pensione, tre scenari ETF, reddito, gap e serie per il grafico", () => {
    const input = buildDemoInput(now);
    const r = runSimulation(input, undefined, now);
    expect(r.errori).toHaveLength(0);
    expect(r.etfAttivo).toBe(true);
    expect(r.pensione.risultato!.pensioneMensileLorda).toBeGreaterThan(0);
    expect(r.etf.centrale.risultato!.capitaleFinale).toBeGreaterThan(0);
    expect(r.serie[0].eta).toBe(input.personal.eta);
    expect(r.serie[r.serie.length - 1].eta).toBe(67);
    expect(r.reddito.gapReale).toBeGreaterThanOrEqual(0);
    expect(r.reddito.totaleMensileReale).toBeCloseTo(r.reddito.pensioneMediaMensileReale + r.reddito.etfMensileReale, 6);
  });

  it("l'ultimo punto della serie coincide con montante e capitale finali", () => {
    const r = runSimulation(buildDemoInput(now), undefined, now);
    const last = r.serie[r.serie.length - 1];
    expect(last.montante).toBeCloseTo(r.pensione.risultato!.montanteFinale, 6);
    expect(last.etfCentrale).toBeCloseTo(r.etf.centrale.risultato!.capitaleFinale, 6);
  });

  it("senza prelievo, l'integrazione ETF è zero", () => {
    const input = buildDemoInput(now);
    const r = runSimulation({ ...input, withdrawal: { ...input.withdrawal, modalita: "nessuna" } }, undefined, now);
    expect(r.reddito.etfMensileReale).toBe(0);
  });

  it("usa valori automatici: aliquota dalla categoria, inflazione, rendimento e commissione dalla piattaforma", () => {
    const input = buildDemoInput(now);
    const r = runSimulation(input, undefined, now);
    expect(r.valoriAutomatici.aliquota).toBe(getConfiguredRate(input.personal.categoria));
    expect(r.valoriAutomatici.inflazione).toBe(AUTO_VALUES.inflazione.valore);
    expect(r.valoriAutomatici.rendimentoETF).toBe(AUTO_VALUES.rendimentoETF.valore);
    expect(r.valoriAutomatici.commissionePAC).toBe(getPlatform(input.etf.piattaforma).commissionePAC);
  });

  it("la piattaforma cambia la commissione e quindi il capitale", () => {
    const input = buildDemoInput(now);
    const zero = runSimulation({ ...input, etf: { ...input.etf, piattaforma: "trade_republic" } }, undefined, now);
    const fineco = runSimulation({ ...input, etf: { ...input.etf, piattaforma: "fineco" } }, undefined, now);
    expect(zero.etf.centrale.risultato!.commissioniTotali).toBe(0);
    expect(fineco.etf.centrale.risultato!.commissioniTotali).toBeGreaterThan(0);
    expect(zero.etf.centrale.risultato!.capitaleFinale).toBeGreaterThan(fineco.etf.centrale.risultato!.capitaleFinale);
  });

  it("piano ETF facoltativo: se disattivo, il reddito è solo pensione e la serie non ha ETF", () => {
    const input = buildDemoInput(now);
    const r = runSimulation({ ...input, etf: { ...input.etf, attivo: false } }, undefined, now);
    expect(r.etfAttivo).toBe(false);
    expect(r.reddito.etfMensileReale).toBe(0);
    expect(r.serie.every((p) => p.etfCentrale === null)).toBe(true);
    expect(r.reddito.totaleMensileReale).toBeCloseTo(r.reddito.pensioneMediaMensileReale, 6);
  });

  it("la pensione di invalidità si somma al reddito e riduce il gap", () => {
    const input = buildDemoInput(now);
    const base = runSimulation(input, undefined, now);
    const withInv = runSimulation({ ...input, personal: { ...input.personal, pensioneInvalidita: true, importoInvalidita: 300 } }, undefined, now);
    expect(withInv.reddito.invaliditaMensileReale).toBe(300);
    expect(withInv.reddito.totaleMensileReale).toBeCloseTo(base.reddito.totaleMensileReale + 300, 6);
    expect(withInv.reddito.gapReale).toBeLessThanOrEqual(base.reddito.gapReale);
  });

  it("studente: nessun contributo fino all'età di inizio lavoro", () => {
    const demo = buildDemoInput(now);
    const student: SimulationInput = {
      ...demo,
      personal: { ...demo.personal, eta: 20, annoNascita: 2006, categoria: "studente" },
      career: { ...demo.career, stipendioAnnuo: 25000, anniLavorati: 0, etaInizioLavoro: 25 },
      contributions: { ...demo.contributions, anniContributi: 0 },
    };
    const r = runSimulation(student, undefined, now);
    const rows = r.pensione.dettaglio;
    expect(rows.filter((x) => x.eta < 25).every((x) => x.contributi === 0)).toBe(true);
    const firstWork = rows.find((x) => x.eta === 25)!;
    expect(firstWork.stipendio).toBeCloseTo(25000, 6);
    expect(r.pensione.risultato!.pensioneMensileLorda).toBeGreaterThan(0);
  });
});

describe("9. aggiornamento degli scenari", () => {
  it("25 € in più al mese aumentano il capitale centrale", () => {
    const input = buildDemoInput(now);
    const base = runSimulation(input, undefined, now);
    const more = runSimulation(applyWhatIf(input, { versamentoMensile: input.etf.versamentoMensile + 25 }), undefined, now);
    const delta = more.etf.centrale.risultato!.capitaleFinale - base.etf.centrale.risultato!.capitaleFinale;
    expect(delta).toBeGreaterThan(25 * 12 * input.etf.anni * 0.9);
  });

  it("spostare l'età di pensionamento sposta anche anni di lavoro e utilizzo del capitale", () => {
    const input = buildDemoInput(now);
    const next = applyWhatIf(input, { etaPensionamento: 69 });
    expect(next.personal.etaPensionamento).toBe(69);
    expect(next.career.anniFuturi).toBe(37);
    expect(getEtaUtilizzo(next)).toBe(69);
    expect(input.personal.etaPensionamento).toBe(67); // l'originale non viene modificato
    const a = runSimulation(input, undefined, now);
    const b = runSimulation(next, undefined, now);
    expect(b.pensione.risultato!.pensioneMensileLorda).toBeGreaterThan(a.pensione.risultato!.pensioneMensileLorda);
  });

  it("compareScenarios restituisce una riga per scenario con le metriche principali", () => {
    const input = buildDemoInput(now);
    const rows = compareScenarios(
      [
        { id: "a", nome: "Scenario base", creatoIl: "", aggiornatoIl: "", input },
        { id: "b", nome: "Verso di più", creatoIl: "", aggiornatoIl: "", input: applyWhatIf(input, { versamentoMensile: 300 }) },
      ],
      undefined,
      now,
    );
    expect(rows).toHaveLength(2);
    expect(rows[1].capitaleETF).toBeGreaterThan(rows[0].capitaleETF);
    expect(rows[1].gapReale).toBeLessThanOrEqual(rows[0].gapReale);
  });
});

describe("completezza della simulazione", () => {
  it("conta i campi senza presentarli come probabilità", () => {
    const input = buildDemoInput(now);
    const c = computeCompleteness(input);
    expect(c.percentualeDatiUtente).toBeGreaterThan(0);
    expect(c.percentualeDatiUtente).toBeLessThanOrEqual(100);
    expect(c.daVerificare.length).toBeGreaterThan(0); // parametri demo
    expect(c.automatici.some((a) => a.campo === "auto.inflazione")).toBe(true);
    const missing = computeCompleteness({ ...input, etf: { ...input.etf, versamentiEffettuati: undefined } });
    expect(missing.mancanti.some((m) => m.campo === "etf.versamentiEffettuati")).toBe(true);
  });
});

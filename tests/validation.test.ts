import { describe, expect, it } from "vitest";
import {
  makeContributionsSchema,
  makeEtfSchema,
  personalSchema,
  simulationSchema,
  validateDraft,
} from "@/lib/validation/schemas";
import { buildDemoInput, buildInitialDraft } from "@/config/simulationDefaults";
import { getInputWarnings } from "@/lib/validation/warnings";

const now = new Date("2026-10-14T10:00:00Z");

describe("validazione", () => {
  it("i dati demo sono validi", () => {
    expect(simulationSchema.safeParse(buildDemoInput(now)).success).toBe(true);
  });

  it("la bozza iniziale non è valida finché mancano i dati certi", () => {
    const res = validateDraft(buildInitialDraft(now));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.issues.some((i) => i.path === "personal.eta" && i.step === 1)).toBe(true);
  });

  const personal = { eta: 30, annoNascita: 1996, categoria: "autonomo" as const, etaPensionamento: 67, redditoDesiderato: 1000, pensioneInvalidita: false };

  it("rifiuta età pensionabile non superiore all'età attuale", () => {
    const res = personalSchema.safeParse({ ...personal, eta: 40, annoNascita: 1986, etaPensionamento: 40 });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.issues[0].message).toMatch(/maggiore/);
  });

  it("rifiuta età fuori dai limiti e valori negativi", () => {
    expect(personalSchema.safeParse({ ...personal, eta: 17, annoNascita: 2009 }).success).toBe(false);
    expect(personalSchema.safeParse({ ...personal, eta: 76, annoNascita: 1950, etaPensionamento: 77 }).success).toBe(false);
    expect(personalSchema.safeParse({ ...personal, redditoDesiderato: -1 }).success).toBe(false);
  });

  it("accetta la categoria studente e richiede l'età di inizio lavoro", () => {
    const demo = buildDemoInput(now);
    expect(personalSchema.safeParse({ ...personal, categoria: "studente" }).success).toBe(true);
    const student = { ...demo, personal: { ...demo.personal, categoria: "studente" as const } };
    expect(simulationSchema.safeParse(student).success).toBe(false);
    expect(simulationSchema.safeParse({ ...student, career: { ...student.career, etaInizioLavoro: 35 } }).success).toBe(true);
  });

  it("pensione di invalidità: se selezionata richiede un importo", () => {
    expect(personalSchema.safeParse({ ...personal, pensioneInvalidita: true }).success).toBe(false);
    expect(personalSchema.safeParse({ ...personal, pensioneInvalidita: true, importoInvalidita: 400 }).success).toBe(true);
  });

  it("rifiuta anni ETF pari a zero e piattaforme sconosciute", () => {
    const demo = buildDemoInput(now);
    const schema = makeEtfSchema({ eta: 32 });
    expect(schema.safeParse({ ...demo.etf, anni: 0 }).success).toBe(false);
    expect(schema.safeParse({ ...demo.etf, piattaforma: "inventata" }).success).toBe(false);
    expect(schema.safeParse({ ...demo.etf, versamentoMensile: -1 }).success).toBe(false);
  });

  it("rifiuta anni di contributi incompatibili con l'età", () => {
    const demo = buildDemoInput(now);
    expect(makeContributionsSchema({ eta: 20 }).safeParse({ ...demo.contributions, anniContributi: 15 }).success).toBe(false);
    expect(makeContributionsSchema({ eta: 20 }).safeParse({ ...demo.contributions, anniContributi: -1 }).success).toBe(false);
  });

  it("una crescita dello stipendio elevata è accettata ma genera un avviso (nessuna correzione silenziosa)", () => {
    const demo = buildDemoInput(now);
    const input = { ...demo, career: { ...demo.career, crescitaStipendio: 8 } };
    expect(simulationSchema.safeParse(input).success).toBe(true);
    const warnings = getInputWarnings(input, undefined, now);
    expect(warnings.some((w) => w.campo === "career.crescitaStipendio")).toBe(true);
    expect(input.career.crescitaStipendio).toBe(8);
  });
});

import { z } from "zod";
import { SIMULATION_LIMITS as L } from "@/config/simulationDefaults";
import { PLATFORM_IDS } from "@/config/investmentPlatforms";
import { WORK_CATEGORY_VALUES } from "@/lib/types";

const CURRENT_YEAR = new Date().getFullYear();

/** Numero obbligatorio con messaggi in italiano comprensibili. */
const requiredNumber = (what: string) =>
  z.number({
    required_error: `Inserisci ${what}.`,
    invalid_type_error: `Inserisci ${what} usando solo cifre.`,
  });

const optionalNumber = () => z.number({ invalid_type_error: "Usa solo cifre." }).optional();

const nonNegative = (what: string) => `${what} non può essere negativo.`;

/* -------------------------------------------------------------------------- */
/* Passaggio 1 — Chi sei                                                       */
/* -------------------------------------------------------------------------- */

export const personalBaseSchema = z.object({
  eta: requiredNumber("la tua età")
    .int("L'età deve essere un numero intero.")
    .min(L.etaMin, `Il simulatore è pensato per chi ha almeno ${L.etaMin} anni.`)
    .max(L.etaMax, `Il simulatore arriva fino a ${L.etaMax} anni.`),
  annoNascita: requiredNumber("l'anno di nascita")
    .int("L'anno deve essere un numero intero.")
    .min(CURRENT_YEAR - L.etaMax - 1, "Controlla l'anno di nascita: è fuori dai limiti del simulatore.")
    .max(CURRENT_YEAR - L.etaMin + 1, "Controlla l'anno di nascita: è fuori dai limiti del simulatore."),
  categoria: z.enum(WORK_CATEGORY_VALUES, {
    errorMap: () => ({ message: "Scegli una categoria (anche «Altro o non so»)." }),
  }),
  etaPensionamento: requiredNumber("l'età a cui vorresti andare in pensione")
    .int("L'età deve essere un numero intero.")
    .min(L.etaMin + 1, "L'età di pensionamento è troppo bassa.")
    .max(L.etaPensionamentoMax, `Il simulatore arriva fino a ${L.etaPensionamentoMax} anni.`),
  redditoDesiderato: requiredNumber("il reddito mensile che desideri")
    .min(0, nonNegative("Il reddito desiderato"))
    .max(1_000_000, "Il valore sembra troppo alto: controllalo."),
  pensioneInvalidita: z.boolean(),
  importoInvalidita: optionalNumber().refine((v) => v === undefined || v >= 0, nonNegative("L'importo")),
});

export const personalSchema = personalBaseSchema.superRefine((v, ctx) => {
  if (v.etaPensionamento <= v.eta) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["etaPensionamento"],
      message: "L'età di pensionamento deve essere maggiore della tua età attuale.",
    });
  }
  if (v.pensioneInvalidita && (v.importoInvalidita === undefined || v.importoInvalidita <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["importoInvalidita"],
      message: "Indica l'importo mensile della pensione di invalidità.",
    });
  }
});

/* -------------------------------------------------------------------------- */
/* Passaggio 2 — La tua carriera                                               */
/* -------------------------------------------------------------------------- */

export const careerBaseSchema = z.object({
  modalitaStipendio: z.enum(["annuo", "mensile"]),
  stipendioAnnuo: requiredNumber("lo stipendio lordo annuo")
    .min(0, nonNegative("Lo stipendio"))
    .max(L.stipendioMax, "Il valore sembra troppo alto: controllalo."),
  stipendioMensile: optionalNumber().refine((v) => v === undefined || v >= 0, nonNegative("Lo stipendio")),
  mensilita: requiredNumber("il numero di mensilità")
    .int("Le mensilità devono essere un numero intero.")
    .min(12, "Le mensilità vanno da 12 a 16.")
    .max(16, "Le mensilità vanno da 12 a 16."),
  anniLavorati: requiredNumber("gli anni già lavorati")
    .int("Usa un numero intero di anni.")
    .min(0, nonNegative("Il numero di anni"))
    .max(L.anniMax, "Il valore è fuori dai limiti del simulatore."),
  anniFuturi: requiredNumber("gli anni di lavoro che prevedi")
    .int("Usa un numero intero di anni.")
    .min(0, nonNegative("Il numero di anni"))
    .max(L.anniMax, "Il valore è fuori dai limiti del simulatore."),
  crescitaStipendio: requiredNumber("la crescita annua dello stipendio")
    .min(L.crescitaMin, `La crescita deve essere almeno ${L.crescitaMin}%.`)
    .max(L.crescitaMax, `La crescita non può superare ${L.crescitaMax}% nel simulatore.`),
  crescitaSconosciuta: z.boolean(),
  /** Solo per chi studia: età a cui prevede di iniziare a lavorare. */
  etaInizioLavoro: optionalNumber(),
});

export function makeCareerSchema(ctx: { eta?: number; etaPensionamento?: number; categoria?: string }) {
  return careerBaseSchema.superRefine((v, c) => {
    if (ctx.categoria !== "studente") return;
    if (v.etaInizioLavoro === undefined) {
      c.addIssue({ code: z.ZodIssueCode.custom, path: ["etaInizioLavoro"], message: "Indica a che età pensi di iniziare a lavorare." });
    } else if (ctx.eta !== undefined && v.etaInizioLavoro < ctx.eta) {
      c.addIssue({ code: z.ZodIssueCode.custom, path: ["etaInizioLavoro"], message: "L'età di inizio lavoro non può essere inferiore alla tua età attuale." });
    } else if (ctx.etaPensionamento !== undefined && v.etaInizioLavoro >= ctx.etaPensionamento) {
      c.addIssue({ code: z.ZodIssueCode.custom, path: ["etaInizioLavoro"], message: "Devi iniziare a lavorare prima dell'età di pensionamento." });
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Passaggio 3 — I tuoi contributi                                             */
/* -------------------------------------------------------------------------- */

export const contributionsBaseSchema = z.object({
  anniContributi: requiredNumber("gli anni di contributi già versati (anche 0)")
    .int("Usa un numero intero di anni.")
    .min(0, nonNegative("Il numero di anni"))
    .max(L.anniMax, "Il valore è fuori dai limiti del simulatore."),
  mesiContributi: requiredNumber("i mesi (anche 0)")
    .int("Usa un numero intero di mesi.")
    .min(0, nonNegative("Il numero di mesi"))
    .max(11, "I mesi vanno da 0 a 11."),
  altreGestioni: z.boolean(),
});

export function makeContributionsSchema(ctx: { eta?: number }) {
  return contributionsBaseSchema.superRefine((v, c) => {
    if (ctx.eta !== undefined) {
      const maxAnni = Math.max(0, ctx.eta - 14);
      if (v.anniContributi + v.mesiContributi / 12 > maxAnni) {
        c.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["anniContributi"],
          message: `Con ${ctx.eta} anni di età, gli anni di contributi non possono superare ${maxAnni}.`,
        });
      }
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Passaggio 4 — Il tuo piano ETF (facoltativo)                                */
/* -------------------------------------------------------------------------- */

export const etfBaseSchema = z.object({
  attivo: z.boolean(),
  piattaforma: z.enum(PLATFORM_IDS, { errorMap: () => ({ message: "Scegli dove investiresti (anche «Non so»)." }) }),
  capitaleIniziale: requiredNumber("il capitale già investito (anche 0)")
    .min(0, nonNegative("Il capitale"))
    .max(L.capitaleMax, "Il valore sembra troppo alto: controllalo."),
  versamentiEffettuati: optionalNumber().refine((v) => v === undefined || v >= 0, nonNegative("Il totale versato")),
  versamentoMensile: requiredNumber("quanto vuoi versare ogni mese (anche 0)")
    .min(0, nonNegative("Il versamento"))
    .max(L.versamentoMax, "Il valore sembra troppo alto: controllalo."),
  anni: requiredNumber("per quanti anni vuoi versare")
    .int("Usa un numero intero di anni.")
    .min(1, "Il piano deve durare almeno 1 anno.")
    .max(L.anniMax, "Il valore è fuori dai limiti del simulatore."),
  incrementoVersamento: requiredNumber("l'aumento annuo del versamento (anche 0)")
    .min(0, nonNegative("L'aumento"))
    .max(20, "L'aumento non può superare il 20% annuo nel simulatore."),
  /** True: il capitale si usa dall'età di pensionamento. */
  utilizzoAllaPensione: z.boolean(),
  etaUtilizzo: requiredNumber("l'età in cui vuoi usare i soldi investiti")
    .int("L'età deve essere un numero intero.")
    .min(L.etaMin + 1, "L'età è troppo bassa.")
    .max(L.etaUtilizzoMax, `Il simulatore arriva fino a ${L.etaUtilizzoMax} anni.`),
});

export function makeEtfSchema(ctx: { eta?: number }) {
  return etfBaseSchema.superRefine((v, c) => {
    if (v.attivo && !v.utilizzoAllaPensione && ctx.eta !== undefined && v.etaUtilizzo <= ctx.eta) {
      c.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["etaUtilizzo"],
        message: "L'età in cui usi i soldi investiti deve essere maggiore della tua età attuale.",
      });
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Prelievo del capitale e metadati                                            */
/* -------------------------------------------------------------------------- */

export const withdrawalSchema = z.object({
  modalita: z.enum(["anni", "percentuale", "nessuna"]),
  anni: requiredNumber("per quanti anni vuoi usare il capitale")
    .int("Usa un numero intero di anni.")
    .min(1, "Almeno 1 anno.")
    .max(50, "Al massimo 50 anni."),
  percentuale: requiredNumber("la percentuale annua di prelievo")
    .min(0.1, "Almeno 0,1%.")
    .max(20, "Al massimo 20%."),
});

export const metaSchema = z.object({
  isDemo: z.boolean(),
  creatoIl: z.string(),
  aggiornatoIl: z.string(),
});

/* -------------------------------------------------------------------------- */
/* Simulazione completa                                                        */
/* -------------------------------------------------------------------------- */

export const simulationSchema = z
  .object({
    personal: personalBaseSchema,
    career: careerBaseSchema,
    contributions: contributionsBaseSchema,
    etf: etfBaseSchema,
    withdrawal: withdrawalSchema,
    meta: metaSchema,
  })
  .superRefine((v, ctx) => {
    const add = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    const checks: [z.ZodTypeAny, unknown, string][] = [
      [personalSchema, v.personal, "personal"],
      [
        makeCareerSchema({ eta: v.personal.eta, etaPensionamento: v.personal.etaPensionamento, categoria: v.personal.categoria }),
        v.career,
        "career",
      ],
      [makeContributionsSchema({ eta: v.personal.eta }), v.contributions, "contributions"],
      [makeEtfSchema({ eta: v.personal.eta }), v.etf, "etf"],
    ];
    for (const [schema, value, key] of checks) {
      const res = schema.safeParse(value);
      if (!res.success) {
        for (const issue of res.error.issues) add([key, ...issue.path], issue.message);
      }
    }
  });

export type PersonalData = z.infer<typeof personalBaseSchema>;
export type CareerData = z.infer<typeof careerBaseSchema>;
export type ContributionsData = z.infer<typeof contributionsBaseSchema>;
export type ETFData = z.infer<typeof etfBaseSchema>;
export type WithdrawalData = z.infer<typeof withdrawalSchema>;
export type SimulationMeta = z.infer<typeof metaSchema>;
export type SimulationInput = z.infer<typeof simulationSchema>;

export type SimulationSection = Exclude<keyof SimulationInput, "meta">;

/** Bozza in compilazione: ogni sezione può essere parziale. */
export type SimulationDraft = {
  [K in SimulationSection]: Partial<SimulationInput[K]>;
} & { meta: SimulationMeta };

/** Indica in quale passaggio del percorso si trova ogni sezione. */
export const SECTION_STEP: Record<SimulationSection, number> = {
  personal: 1,
  career: 2,
  contributions: 3,
  etf: 4,
  withdrawal: 5,
};

export interface ValidationIssue {
  path: string;
  message: string;
  step: number;
}

/** Valida una bozza e restituisce un input completo oppure l'elenco dei problemi. */
export function validateDraft(
  draft: SimulationDraft,
): { ok: true; data: SimulationInput } | { ok: false; issues: ValidationIssue[] } {
  const res = simulationSchema.safeParse(draft);
  if (res.success) return { ok: true, data: res.data };
  const issues = res.error.issues.map((issue) => {
    const section = String(issue.path[0] ?? "") as SimulationSection;
    return {
      path: issue.path.join("."),
      message: issue.message,
      step: SECTION_STEP[section] ?? 1,
    };
  });
  return { ok: false, issues };
}

/**
 * Valori automatici, ipotesi predefinite e limiti del simulatore.
 * Sono configurabili dall'amministratore senza toccare i motori di calcolo.
 */
import type { SimulationDraft, SimulationInput } from "@/lib/validation/schemas";
import { pensionParameters } from "@/config/pensionParameters";

export const SIMULATION_LIMITS = {
  etaMin: 18,
  etaMax: 75,
  etaPensionamentoMax: 75,
  etaUtilizzoMax: 100,
  anniMax: 60,
  crescitaMin: -5,
  crescitaMax: 10,
  crescitaAvviso: 5,
  stipendioMax: 5_000_000,
  versamentoMax: 100_000,
  capitaleMax: 50_000_000,
} as const;

/**
 * VALORI AUTOMATICI — calcolati o stimati dal simulatore e NON modificabili dall'utente.
 * Ogni valore dichiara la sua origine e se è verificato o dimostrativo.
 */
export const AUTO_VALUES = {
  inflazione: {
    valore: 2,
    stato: "riferimento_ufficiale" as const,
    descrizione:
      "Obiettivo di inflazione di medio periodo della Banca Centrale Europea (2%). È un riferimento ufficiale, non una previsione: l'inflazione reale di ogni anno può essere diversa.",
    fonte: { nome: "Banca Centrale Europea — strategia di politica monetaria", url: "https://www.ecb.europa.eu" },
  },
  rendimentoETF: {
    valore: 4,
    stato: "demo" as const,
    descrizione:
      "Rendimento annuo lordo didattico per lo scenario centrale. Non deriva da serie storiche e non è una previsione: i rendimenti futuri non sono conoscibili.",
  },
  costoAnnuoETF: {
    valore: 0.2,
    stato: "demo" as const,
    descrizione:
      "Costo annuo indicativo (TER) di un ETF azionario globale a replica di indice. Dipende dall'ETF, non dalla banca: verifica il documento informativo dello strumento.",
  },
  rendimentoPrelievo: {
    valore: 0,
    stato: "demo" as const,
    descrizione:
      "Durante il prelievo si ipotizza prudentemente che il capitale cresca quanto l'inflazione (rendimento reale 0%).",
  },
} as const;

/** Ipotesi predefinite modificabili dall'utente (in punti percentuali dove indicato). */
export const HYPOTHESIS_DEFAULTS = {
  /** Crescita annua nominale dello stipendio usata se l'utente non la conosce. */
  crescitaStipendio: 1,
  incrementoVersamento: 0,
  versamentoMensile: 100,
  anniETF: 25,
  mensilitaStipendio: 13,
  anniPrelievo: 25,
  percentualePrelievo: 3,
  piattaforma: "non_so",
} as const;

/**
 * Variazione (in punti percentuali) applicata al rendimento centrale per
 * costruire gli scenari didattici prudente e favorevole.
 */
export const SCENARIO_SPREAD = {
  prudente: -2,
  favorevole: 2,
} as const;

export const MAX_SAVED_SCENARIOS = 3;

export const SCENARIO_NAME_PRESETS = ["Scenario base", "Inizio prima", "Verso di più"] as const;

/** Bozza iniziale: i DATI CERTI sono vuoti, le ipotesi hanno i valori predefiniti. */
export function buildInitialDraft(now: Date = new Date()): SimulationDraft {
  const iso = now.toISOString();
  return {
    personal: {
      categoria: "dipendente_privato",
      etaPensionamento: pensionParameters.etaPensionabile.valore,
      pensioneInvalidita: false,
    },
    career: {
      modalitaStipendio: "annuo",
      mensilita: HYPOTHESIS_DEFAULTS.mensilitaStipendio,
      crescitaStipendio: HYPOTHESIS_DEFAULTS.crescitaStipendio,
      crescitaSconosciuta: true,
    },
    contributions: {
      mesiContributi: 0,
      altreGestioni: false,
    },
    etf: {
      attivo: false,
      piattaforma: HYPOTHESIS_DEFAULTS.piattaforma,
      capitaleIniziale: 0,
      versamentoMensile: HYPOTHESIS_DEFAULTS.versamentoMensile,
      anni: HYPOTHESIS_DEFAULTS.anniETF,
      incrementoVersamento: HYPOTHESIS_DEFAULTS.incrementoVersamento,
      utilizzoAllaPensione: true,
      etaUtilizzo: pensionParameters.etaPensionabile.valore,
    },
    withdrawal: {
      modalita: "anni",
      anni: HYPOTHESIS_DEFAULTS.anniPrelievo,
      percentuale: HYPOTHESIS_DEFAULTS.percentualePrelievo,
    },
    meta: { isDemo: false, creatoIl: iso, aggiornatoIl: iso },
  };
}

/**
 * DATI DIMOSTRATIVI — INVENTATI.
 * Servono solo a mostrare il funzionamento del simulatore.
 * Non rappresentano una persona reale, una media italiana o un dato ufficiale.
 */
export function buildDemoInput(now: Date = new Date()): SimulationInput {
  const iso = now.toISOString();
  const eta = 32;
  return {
    personal: {
      eta,
      annoNascita: now.getFullYear() - eta,
      categoria: "dipendente_privato",
      etaPensionamento: 67,
      redditoDesiderato: 2000,
      pensioneInvalidita: false,
      importoInvalidita: undefined,
    },
    career: {
      modalitaStipendio: "annuo",
      stipendioAnnuo: 30000,
      stipendioMensile: undefined,
      mensilita: 13,
      anniLavorati: 7,
      anniFuturi: 35,
      crescitaStipendio: 1.5,
      crescitaSconosciuta: false,
      etaInizioLavoro: undefined,
    },
    contributions: {
      anniContributi: 7,
      mesiContributi: 0,
      altreGestioni: false,
    },
    etf: {
      attivo: true,
      piattaforma: "non_so",
      capitaleIniziale: 5000,
      versamentiEffettuati: 4000,
      versamentoMensile: 150,
      anni: 35,
      incrementoVersamento: 1,
      utilizzoAllaPensione: true,
      etaUtilizzo: 67,
    },
    withdrawal: {
      modalita: "anni",
      anni: 25,
      percentuale: 3,
    },
    meta: { isDemo: true, creatoIl: iso, aggiornatoIl: iso },
  };
}

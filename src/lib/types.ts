/**
 * Le quattro categorie di informazioni che FUTURO.IO tiene sempre separate.
 * - certo: dato inserito dall'utente e documentabile (verde smeraldo)
 * - regola: parametro normativo configurato nel sistema (blu)
 * - ipotesi: scelta dell'utente sul futuro (viola)
 * - incerto: variabile che nessuno può conoscere in anticipo (arancione)
 */
export type DataCategory = "certo" | "regola" | "ipotesi" | "incerto";

export const WORK_CATEGORY_VALUES = [
  "dipendente_privato",
  "dipendente_pubblico",
  "autonomo",
  "gestione_separata",
  "studente",
  "non_so",
] as const;

export type WorkCategory = (typeof WORK_CATEGORY_VALUES)[number];

export const WORK_CATEGORY_LABELS: Record<WorkCategory, string> = {
  dipendente_privato: "Dipendente privato",
  dipendente_pubblico: "Dipendente pubblico",
  autonomo: "Lavoratore autonomo (artigiano/commerciante)",
  gestione_separata: "Gestione separata (collaboratori, partite IVA senza cassa)",
  studente: "Studente o studentessa",
  non_so: "Altro o non so",
};

/** Un'ipotesi o un parametro usato nel calcolo, sempre esplicitato all'utente. */
export interface Assumption {
  id: string;
  etichetta: string;
  valore: string;
  categoria: DataCategory;
  nota?: string;
}

/** Struttura comune restituita da tutti i motori di calcolo. */
export interface CalculationOutput<TResult, TRow> {
  risultato: TResult | null;
  dettaglio: TRow[];
  ipotesi: Assumption[];
  avvisi: string[];
  errori: string[];
}

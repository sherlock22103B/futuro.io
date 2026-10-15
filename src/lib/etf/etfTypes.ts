import type { CalculationOutput } from "@/lib/types";

/** Input del motore ETF. Tutti i tassi sono in forma decimale. */
export interface ETFInput {
  capitaleIniziale: number;
  versamentoMensile: number;
  /** Anni in cui vengono effettuati i versamenti. */
  anniVersamento: number;
  /** Anni totali simulati (fino all'età di utilizzo). Deve essere ≥ 1. */
  anniOrizzonte: number;
  /** Costo annuo dello strumento (es. 0.002 = 0,20%). */
  costoAnnuo: number;
  /** Commissione fissa in euro per ogni versamento. */
  commissione: number;
  inflazione: number;
  /** Aumento annuo del versamento mensile. */
  incrementoVersamento: number;
  etaIniziale: number;
  annoIniziale: number;
}

export type ETFScenarioId = "prudente" | "centrale" | "favorevole";

export interface ETFScenario {
  id: ETFScenarioId;
  nome: string;
  /** Rendimento annuo lordo ipotizzato (forma decimale). */
  rendimento: number;
}

export interface ETFYearRow {
  anno: number;
  annoIndice: number;
  eta: number;
  capitaleIniziale: number;
  versamentiAnno: number;
  versamentiCumulati: number;
  rendimentoLordoAnno: number;
  rendimentoLordoCumulato: number;
  costiAnno: number;
  costiCumulati: number;
  commissioniCumulate: number;
  costiGestioneCumulati: number;
  capitaleFinale: number;
  capitaleFinaleReale: number;
}

export interface ETFResult {
  scenario: ETFScenario;
  capitaleFinale: number;
  capitaleFinaleReale: number;
  versamentiTotali: number;
  /** Capitale iniziale + versamenti. */
  totaleInvestito: number;
  rendimentoLordoTotale: number;
  costiGestioneTotali: number;
  commissioniTotali: number;
  costiTotali: number;
  /** True se il capitale finale è inferiore al totale investito. */
  sottoInvestito: boolean;
}

export type ETFOutput = CalculationOutput<ETFResult, ETFYearRow>;

export interface ETFScenariosOutput {
  prudente: ETFOutput;
  centrale: ETFOutput;
  favorevole: ETFOutput;
}

import type { CalculationOutput } from "@/lib/types";

/** Input del motore pensionistico. Tutti i tassi sono in forma decimale (0.33 = 33%). */
export interface PensionInput {
  etaAttuale: number;
  annoCorrente: number;
  etaPensionamento: number;
  /** Retribuzione imponibile annua attuale (lorda). */
  stipendioAnnuo: number;
  /** Crescita nominale annua dello stipendio. */
  crescitaStipendio: number;
  /** Aliquota contributiva di computo. */
  aliquota: number;
  /** Montante già maturato; null se non conosciuto (verrà stimato). */
  montanteIniziale: number | null;
  /** Anni di contribuzione passata, usati solo se il montante va stimato. */
  anniContributiPassati: number;
  /** Tasso annuo di rivalutazione del montante. */
  rivalutazione: number;
  /** Se il montante si rivaluta anche negli anni senza contributi. */
  rivalutaInPausa: boolean;
  /** Anni da oggi prima di iniziare a lavorare (es. per chi studia). Default 0. */
  anniPrimaDelLavoro?: number;
  /** Anni futuri di lavoro a partire dall'inizio del lavoro (oltre questi non ci sono contributi). */
  anniLavoroFuturi: number;
  /** Età (anni di vita) in cui non verranno versati contributi. */
  etaSenzaContributi: number[];
  /** Coefficiente di trasformazione inserito dall'utente; null = usa la configurazione. */
  coefficienteOverride: number | null;
  /** Inflazione annua usata per il valore reale. */
  inflazione: number;
}

/** Parametri normativi richiesti dal motore (ricavati da src/config/pensionParameters.ts). */
export interface PensionEngineParameters {
  /** Coefficienti di trasformazione in forma decimale indicizzati per età. */
  coefficienti: Record<number, number>;
  mensilita: number;
  coefficientiDemo: boolean;
}

export interface PensionYearRow {
  eta: number;
  anno: number;
  stipendio: number;
  contributi: number;
  montanteIniziale: number;
  rivalutazione: number;
  montanteFinale: number;
  senzaContributi: boolean;
}

export interface PensionResult {
  montanteIniziale: number;
  montanteStimato: boolean;
  montanteFinale: number;
  montanteFinaleReale: number;
  contributiFuturiTotali: number;
  rivalutazioneTotale: number;
  coefficiente: number;
  coefficienteFonte: "utente" | "configurazione";
  etaCoefficiente: number;
  pensioneAnnuaLorda: number;
  pensioneMensileLorda: number;
  pensioneMensileLordaReale: number;
  mensilita: number;
  anniAllaPensione: number;
  annoPensionamento: number;
  anniSenzaContributi: number;
}

export type PensionOutput = CalculationOutput<PensionResult, PensionYearRow>;

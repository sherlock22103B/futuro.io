/**
 * PARAMETRI PREVIDENZIALI CONFIGURATI
 * ------------------------------------------------------------------
 * Questo è l'UNICO punto in cui vanno aggiornati i parametri normativi.
 * Il motore di calcolo (src/lib/pension) li legge da qui e non contiene
 * valori codificati.
 *
 * STATO ATTUALE: tutti i valori sono DIMOSTRATIVI.
 * Non sono stati verificati su una fonte ufficiale al momento della
 * scrittura e NON devono essere presentati come dati ufficiali.
 *
 * Per aggiornare un parametro:
 *  1. verificare il valore sulla fonte ufficiale (INPS, Ministero del Lavoro, Gazzetta Ufficiale);
 *  2. sostituire `valore`;
 *  3. impostare `stato: "verificato"` e compilare `fonte` e `verificatoIl`;
 *  4. aggiornare `dataAggiornamento`.
 */

import type { WorkCategory } from "@/lib/types";

export type ParameterStatus = "demo" | "verificato";

export const DEMO_LABEL = "VALORE DEMO — DA SOSTITUIRE CON PARAMETRO UFFICIALE";

export interface ParameterSource {
  nome: string;
  url: string;
}

export interface ConfiguredValue<T> {
  valore: T;
  stato: ParameterStatus;
  descrizione: string;
  fonte?: ParameterSource;
  verificatoIl?: string;
}

export interface PensionParametersConfig {
  /** Data ISO dell'ultimo aggiornamento del file. */
  dataAggiornamento: string;
  /** Aliquota contributiva di computo, in punti percentuali, per categoria. */
  aliquotePerCategoria: Record<WorkCategory, ConfiguredValue<number>>;
  /** Coefficienti di trasformazione in punti percentuali, indicizzati per età. */
  coefficientiTrasformazione: ConfiguredValue<Record<number, number>>;
  /** Età pensionabile di riferimento configurata. */
  etaPensionabile: ConfiguredValue<number>;
  /** Numero di mensilità con cui viene pagata la pensione. */
  mensilitaPensione: ConfiguredValue<number>;
  /** Tasso annuo di rivalutazione del montante proposto come default, in punti percentuali. */
  rivalutazioneDefault: ConfiguredValue<number>;
  /** Se il montante continua a rivalutarsi negli anni senza contributi. */
  rivalutaAnniSenzaContributi: ConfiguredValue<boolean>;
  /** Trattamento fiscale: nell'MVP non viene applicato. */
  trattamentoFiscale: ConfiguredValue<"non_applicato">;
  fontePrincipale: ParameterSource;
  noteMetodologiche: string[];
}

const FONTE_INPS: ParameterSource = { nome: "INPS — Istituto Nazionale della Previdenza Sociale", url: "https://www.inps.it" };
const FONTE_MINLAVORO: ParameterSource = { nome: "Ministero del Lavoro e delle Politiche Sociali", url: "https://www.lavoro.gov.it" };

const demoRate = (valore: number, descrizione: string): ConfiguredValue<number> => ({
  valore,
  stato: "demo",
  descrizione,
  fonte: FONTE_INPS,
});

export const pensionParameters: PensionParametersConfig = {
  dataAggiornamento: "2026-10-14",

  aliquotePerCategoria: {
    dipendente_privato: demoRate(33, "Aliquota di computo dimostrativa per lavoratori dipendenti del settore privato."),
    dipendente_pubblico: demoRate(33, "Aliquota di computo dimostrativa per lavoratori dipendenti del settore pubblico."),
    autonomo: demoRate(24, "Aliquota di computo dimostrativa per artigiani e commercianti."),
    gestione_separata: demoRate(33, "Aliquota di computo dimostrativa per iscritti alla gestione separata."),
    studente: demoRate(33, "Per chi studia si ipotizza un futuro lavoro dipendente nel settore privato (aliquota dimostrativa)."),
    non_so: demoRate(33, "Parametro dimostrativo usato quando la categoria non è nota. Va sostituito con l'aliquota della tua gestione."),
  },

  coefficientiTrasformazione: {
    stato: "demo",
    descrizione:
      "Coefficienti dimostrativi (in %) che trasformano il montante in pensione annua. I coefficienti reali sono aggiornati periodicamente con decreto: verificali sulla fonte ufficiale prima di usare i risultati.",
    fonte: FONTE_MINLAVORO,
    valore: {
      57: 4.204,
      58: 4.308,
      59: 4.419,
      60: 4.536,
      61: 4.661,
      62: 4.795,
      63: 4.936,
      64: 5.088,
      65: 5.25,
      66: 5.423,
      67: 5.608,
      68: 5.808,
      69: 6.024,
      70: 6.257,
      71: 6.513,
    },
  },

  etaPensionabile: {
    valore: 67,
    stato: "demo",
    descrizione:
      "Età di riferimento dimostrativa per la pensione di vecchiaia. I requisiti reali dipendono da norme, adeguamenti alla speranza di vita e anzianità contributiva.",
    fonte: FONTE_INPS,
  },

  mensilitaPensione: {
    valore: 13,
    stato: "demo",
    descrizione: "Numero di mensilità annue con cui viene suddivisa la pensione (dimostrativo).",
    fonte: FONTE_INPS,
  },

  rivalutazioneDefault: {
    valore: 1.5,
    stato: "demo",
    descrizione:
      "Tasso annuo dimostrativo di rivalutazione del montante. Il tasso reale è legato all'andamento dell'economia e cambia ogni anno: è una variabile incerta.",
    fonte: FONTE_INPS,
  },

  rivalutaAnniSenzaContributi: {
    valore: true,
    stato: "demo",
    descrizione:
      "Se attivo, il montante già accumulato continua a rivalutarsi anche negli anni senza nuovi contributi. Comportamento configurabile.",
  },

  trattamentoFiscale: {
    valore: "non_applicato",
    stato: "demo",
    descrizione:
      "Nell'MVP non viene applicata alcuna imposta: pensione e capitale ETF sono mostrati al lordo della tassazione.",
  },

  fontePrincipale: FONTE_INPS,

  noteMetodologiche: [
    "La stima segue la logica del sistema contributivo: contributi annui accumulati in un montante, rivalutato ogni anno e trasformato in pensione con un coefficiente legato all'età.",
    "Tutti i parametri di questo file sono dimostrativi finché non vengono verificati e marcati come tali.",
    "Non sono gestiti: sistema retributivo o misto, ricongiunzioni, riscatti, casse professionali, cumulo, totalizzazione, pensioni anticipate, integrazioni al minimo, tassazione.",
  ],
};

/** Restituisce l'aliquota configurata per una categoria lavorativa. */
export function getConfiguredRate(category: WorkCategory, params: PensionParametersConfig = pensionParameters): number {
  return params.aliquotePerCategoria[category].valore;
}

/** True se almeno un parametro del file è ancora dimostrativo. */
export function hasDemoParameters(params: PensionParametersConfig = pensionParameters): boolean {
  const values: ConfiguredValue<unknown>[] = [
    ...Object.values(params.aliquotePerCategoria),
    params.coefficientiTrasformazione,
    params.etaPensionabile,
    params.mensilitaPensione,
    params.rivalutazioneDefault,
    params.rivalutaAnniSenzaContributi,
  ];
  return values.some((v) => v.stato === "demo");
}

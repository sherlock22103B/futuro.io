import type { Assumption } from "@/lib/types";
import { formatPercent } from "@/lib/format";

export type WithdrawalMode = "anni" | "percentuale" | "nessuna";

export interface WithdrawalOptions {
  modalita: WithdrawalMode;
  /** Anni di prelievo (modalità "anni"). */
  anni: number;
  /** Percentuale annua del capitale prelevata (modalità "percentuale"), forma decimale. */
  percentuale: number;
  /** Rendimento annuo ipotizzato durante il prelievo, forma decimale. */
  rendimento: number;
}

export interface RetirementIncomeResult {
  modalita: WithdrawalMode;
  prelievoMensile: number;
  prelievoAnnuo: number;
  /** Anni per cui il prelievo è sostenibile; null se non applicabile o se il capitale non si esaurisce. */
  durataAnni: number | null;
  ipotesi: Assumption[];
  avvisi: string[];
  errori: string[];
}

/**
 * Trasforma un capitale in un'integrazione mensile SIMULATA, secondo l'ipotesi scelta.
 * Non è una rendita garantita.
 *
 * - "anni": prelievo costante che esaurisce il capitale in N anni.
 *   Con rendimento mensile i: P = C · i / (1 − (1 + i)^−n); con i = 0: P = C / n.
 * - "percentuale": ogni anno si preleva una quota fissa del capitale iniziale.
 * - "nessuna": il capitale viene solo mostrato, senza conversione.
 */
export function calculateRetirementIncome(capital: number, options: WithdrawalOptions): RetirementIncomeResult {
  const avvisi: string[] = [];
  const errori: string[] = [];
  const ipotesi: Assumption[] = [];
  const C = Math.max(0, capital);

  if (options.modalita === "nessuna") {
    ipotesi.push({ id: "prelievo", etichetta: "Uso del capitale", valore: "Nessuna conversione in reddito", categoria: "ipotesi" });
    return { modalita: "nessuna", prelievoMensile: 0, prelievoAnnuo: 0, durataAnni: null, ipotesi, avvisi, errori };
  }

  const i = Math.pow(1 + options.rendimento, 1 / 12) - 1;

  if (options.modalita === "anni") {
    if (!(options.anni > 0)) {
      errori.push("Indica per quanti anni vuoi usare il capitale.");
      return { modalita: "anni", prelievoMensile: 0, prelievoAnnuo: 0, durataAnni: null, ipotesi, avvisi, errori };
    }
    const n = Math.round(options.anni * 12);
    const mensile = Math.abs(i) < 1e-12 ? C / n : (C * i) / (1 - Math.pow(1 + i, -n));
    ipotesi.push(
      { id: "prelievo", etichetta: "Uso del capitale", valore: `Prelievo costante per ${options.anni} anni`, categoria: "ipotesi" },
      { id: "rendimento-prelievo", etichetta: "Rendimento durante il prelievo", valore: formatPercent(options.rendimento * 100), categoria: "incerto" },
    );
    return { modalita: "anni", prelievoMensile: mensile, prelievoAnnuo: mensile * 12, durataAnni: options.anni, ipotesi, avvisi, errori };
  }

  // Percentuale annua
  if (!(options.percentuale > 0)) {
    errori.push("La percentuale di prelievo deve essere maggiore di zero.");
    return { modalita: "percentuale", prelievoMensile: 0, prelievoAnnuo: 0, durataAnni: null, ipotesi, avvisi, errori };
  }
  const annuo = C * options.percentuale;
  const mensile = annuo / 12;
  // Durata: mesi finché il capitale, prelevando "mensile" e rendendo "i", non si esaurisce.
  let durataAnni: number | null = null;
  if (C > 0) {
    if (mensile <= C * i) {
      durataAnni = null; // il rendimento ipotizzato copre il prelievo: il capitale non si esaurisce
      avvisi.push("Con le ipotesi scelte il prelievo non esaurisce il capitale, ma il rendimento non è garantito.");
    } else if (Math.abs(i) < 1e-12) {
      durataAnni = C / annuo;
    } else {
      const n = -Math.log(1 - (C * i) / mensile) / Math.log(1 + i);
      durataAnni = Number.isFinite(n) ? n / 12 : null;
    }
  }
  ipotesi.push(
    { id: "prelievo", etichetta: "Uso del capitale", valore: `Prelievo annuo del ${formatPercent(options.percentuale * 100)} del capitale iniziale`, categoria: "ipotesi" },
    { id: "rendimento-prelievo", etichetta: "Rendimento durante il prelievo", valore: formatPercent(options.rendimento * 100), categoria: "incerto" },
  );
  return { modalita: "percentuale", prelievoMensile: mensile, prelievoAnnuo: annuo, durataAnni, ipotesi, avvisi, errori };
}

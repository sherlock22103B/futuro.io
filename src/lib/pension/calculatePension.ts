import type { Assumption } from "@/lib/types";
import type { PensionParametersConfig } from "@/config/pensionParameters";
import { calculateRealValue } from "@/lib/inflation/calculateRealValue";
import { formatEuro, formatPercent } from "@/lib/format";
import type {
  PensionEngineParameters,
  PensionInput,
  PensionOutput,
  PensionYearRow,
} from "./pensionTypes";

/** Converte la configurazione centralizzata nei parametri del motore. */
export function toPensionEngineParameters(config: PensionParametersConfig): PensionEngineParameters {
  const coefficienti: Record<number, number> = {};
  for (const [age, pct] of Object.entries(config.coefficientiTrasformazione.valore)) {
    coefficienti[Number(age)] = pct / 100;
  }
  return {
    coefficienti,
    mensilita: config.mensilitaPensione.valore,
    coefficientiDemo: config.coefficientiTrasformazione.stato === "demo",
  };
}

/** Restituisce il coefficiente per l'età indicata, usando l'estremo più vicino fuori tabella. */
export function lookupCoefficient(
  coefficienti: Record<number, number>,
  eta: number,
): { valore: number; etaUsata: number; fuoriTabella: boolean } | null {
  const ages = Object.keys(coefficienti)
    .map(Number)
    .sort((a, b) => a - b);
  if (ages.length === 0) return null;
  if (coefficienti[eta] !== undefined) return { valore: coefficienti[eta], etaUsata: eta, fuoriTabella: false };
  const etaUsata = eta < ages[0] ? ages[0] : ages[ages.length - 1];
  return { valore: coefficienti[etaUsata], etaUsata, fuoriTabella: true };
}

/**
 * Stima il montante già maturato quando l'utente non lo conosce:
 * ricostruisce gli anni passati partendo dallo stipendio attuale scontato
 * della crescita ipotizzata, applicando aliquota e rivalutazione.
 */
export function estimatePastMontante(input: Pick<PensionInput, "stipendioAnnuo" | "crescitaStipendio" | "aliquota" | "rivalutazione" | "anniContributiPassati">): number {
  const fullYears = Math.floor(input.anniContributiPassati);
  const fraction = input.anniContributiPassati - fullYears;
  let montante = 0;
  for (let k = fullYears; k >= 1; k--) {
    const stipendioPassato = input.stipendioAnnuo / Math.pow(1 + input.crescitaStipendio, k);
    montante = montante * (1 + input.rivalutazione) + stipendioPassato * input.aliquota;
  }
  if (fraction > 0) {
    montante += input.stipendioAnnuo * input.aliquota * fraction;
  }
  return montante;
}

/**
 * Stima della pensione pubblica con logica contributiva, calcolata ANNO PER ANNO.
 *
 *   contributi anno       = retribuzione imponibile × aliquota
 *   montante anno + 1     = montante × (1 + rivalutazione) + contributi anno
 *   pensione annua lorda  = montante finale × coefficiente di trasformazione
 *   pensione mensile      = pensione annua ÷ mensilità
 */
export function calculatePension(input: PensionInput, params: PensionEngineParameters): PensionOutput {
  const errori: string[] = [];
  const avvisi: string[] = [];
  const ipotesi: Assumption[] = [];

  if (input.etaPensionamento <= input.etaAttuale) {
    errori.push("L'età di pensionamento deve essere maggiore dell'età attuale.");
  }
  if (input.stipendioAnnuo < 0) errori.push("Lo stipendio non può essere negativo.");
  if (input.aliquota < 0) errori.push("L'aliquota contributiva non può essere negativa.");
  if (input.montanteIniziale !== null && input.montanteIniziale < 0) errori.push("Il montante non può essere negativo.");
  if (input.anniLavoroFuturi < 0) errori.push("Gli anni futuri di lavoro non possono essere negativi.");
  if (params.mensilita <= 0) errori.push("Il numero di mensilità configurato non è valido.");

  if (errori.length > 0) {
    return { risultato: null, dettaglio: [], ipotesi, avvisi, errori };
  }

  // Montante di partenza
  let montanteStimato = false;
  let montante = input.montanteIniziale ?? 0;
  if (input.montanteIniziale === null) {
    montanteStimato = true;
    montante = estimatePastMontante(input);
    if (input.anniContributiPassati > 0) {
      avvisi.push(
        `Non hai indicato il montante già maturato: è stato stimato in ${formatEuro(montante)} ricostruendo ${input.anniContributiPassati.toLocaleString("it-IT", { maximumFractionDigits: 1 })} anni passati. Il valore reale è nel tuo estratto conto contributivo.`,
      );
    }
  }
  const montanteIniziale = montante;

  // Proiezione anno per anno
  const gapSet = new Set(input.etaSenzaContributi);
  const anniAllaPensione = input.etaPensionamento - input.etaAttuale;
  const dettaglio: PensionYearRow[] = [];
  let contributiFuturiTotali = 0;
  let rivalutazioneTotale = 0;
  let anniSenzaContributi = 0;

  const ritardo = Math.max(0, input.anniPrimaDelLavoro ?? 0);
  for (let k = 0; k < anniAllaPensione; k++) {
    const eta = input.etaAttuale + k;
    const kLavoro = k - ritardo;
    const lavora = kLavoro >= 0 && kLavoro < input.anniLavoroFuturi && !gapSet.has(eta);
    const stipendio = lavora ? input.stipendioAnnuo * Math.pow(1 + input.crescitaStipendio, kLavoro) : 0;
    const contributi = stipendio * input.aliquota;
    const rivaluta = lavora || input.rivalutaInPausa;
    const rivalutazione = rivaluta ? montante * input.rivalutazione : 0;
    const montanteFinale = montante + rivalutazione + contributi;

    if (!lavora) anniSenzaContributi++;
    contributiFuturiTotali += contributi;
    rivalutazioneTotale += rivalutazione;

    dettaglio.push({
      eta,
      anno: input.annoCorrente + k,
      stipendio,
      contributi,
      montanteIniziale: montante,
      rivalutazione,
      montanteFinale,
      senzaContributi: !lavora,
    });
    montante = montanteFinale;
  }

  // Coefficiente di trasformazione
  let coefficiente: number;
  let coefficienteFonte: "utente" | "configurazione";
  let etaCoefficiente = input.etaPensionamento;
  if (input.coefficienteOverride !== null && input.coefficienteOverride > 0) {
    coefficiente = input.coefficienteOverride;
    coefficienteFonte = "utente";
  } else {
    const found = lookupCoefficient(params.coefficienti, input.etaPensionamento);
    if (!found) {
      errori.push("Nessun coefficiente di trasformazione configurato.");
      return { risultato: null, dettaglio, ipotesi, avvisi, errori };
    }
    coefficiente = found.valore;
    coefficienteFonte = "configurazione";
    etaCoefficiente = found.etaUsata;
    if (found.fuoriTabella) {
      avvisi.push(
        `Per l'età di ${input.etaPensionamento} anni non è configurato un coefficiente: è stato usato quello dei ${found.etaUsata} anni.`,
      );
    }
    if (params.coefficientiDemo) {
      avvisi.push("Il coefficiente di trasformazione usato è un VALORE DEMO: va sostituito con il parametro ufficiale.");
    }
  }

  const pensioneAnnuaLorda = montante * coefficiente;
  const pensioneMensileLorda = pensioneAnnuaLorda / params.mensilita;

  if (ritardo > 0) {
    avvisi.push(`I primi ${ritardo} anni (prima di iniziare a lavorare) non hanno contributi.`);
  }
  if (anniSenzaContributi > ritardo) {
    avvisi.push(
      `Sono presenti ${anniSenzaContributi - ritardo} anni di lavoro senza nuovi contributi prima della pensione${input.rivalutaInPausa ? " (il montante continua a rivalutarsi)" : " (il montante non viene rivalutato)"}.`,
    );
  }
  if (input.stipendioAnnuo === 0) {
    avvisi.push("Con stipendio pari a zero non vengono versati nuovi contributi.");
  }

  ipotesi.push(
    { id: "aliquota", etichetta: "Aliquota contributiva", valore: formatPercent(input.aliquota * 100), categoria: "regola" },
    { id: "crescita", etichetta: "Crescita annua dello stipendio", valore: formatPercent(input.crescitaStipendio * 100), categoria: "ipotesi" },
    { id: "rivalutazione", etichetta: "Rivalutazione annua del montante", valore: formatPercent(input.rivalutazione * 100), categoria: "incerto" },
    {
      id: "coefficiente",
      etichetta: `Coefficiente di trasformazione (${etaCoefficiente} anni)`,
      valore: formatPercent(coefficiente * 100, 3),
      categoria: coefficienteFonte === "utente" ? "certo" : "regola",
      nota: coefficienteFonte === "utente" ? "Inserito da te" : params.coefficientiDemo ? "Valore demo configurato" : "Valore configurato",
    },
    { id: "mensilita", etichetta: "Mensilità della pensione", valore: String(params.mensilita), categoria: "regola" },
  );

  return {
    risultato: {
      montanteIniziale,
      montanteStimato,
      montanteFinale: montante,
      montanteFinaleReale: calculateRealValue(montante, input.inflazione, anniAllaPensione),
      contributiFuturiTotali,
      rivalutazioneTotale,
      coefficiente,
      coefficienteFonte,
      etaCoefficiente,
      pensioneAnnuaLorda,
      pensioneMensileLorda,
      pensioneMensileLordaReale: calculateRealValue(pensioneMensileLorda, input.inflazione, anniAllaPensione),
      mensilita: params.mensilita,
      anniAllaPensione,
      annoPensionamento: input.annoCorrente + anniAllaPensione,
      anniSenzaContributi,
    },
    dettaglio,
    ipotesi,
    avvisi,
    errori,
  };
}

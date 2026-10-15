import type { Assumption } from "@/lib/types";
import { calculateRealValue } from "@/lib/inflation/calculateRealValue";
import { formatEuro, formatPercent } from "@/lib/format";
import type { ETFInput, ETFOutput, ETFScenario, ETFScenariosOutput, ETFYearRow } from "./etfTypes";

/** Rendimento mensile equivalente: (1 + r)^(1/12) − 1. */
export function monthlyRateFromAnnual(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/**
 * Simulazione di un piano di accumulo, MESE PER MESE.
 *
 * Per ogni mese:
 *  1. si aggiunge il versamento (se il piano è ancora in fase di versamento);
 *  2. si sottrae l'eventuale commissione fissa sul versamento;
 *  3. si applica il rendimento mensile equivalente (1 + r)^(1/12) − 1 → crescita lorda;
 *  4. si sottrae il costo annuo in proporzione mensile (costo annuo ÷ 12 sul capitale);
 *  5. si aggiorna il capitale.
 *
 * Crescita lorda e costi sono tracciati separatamente. Nessuna tassazione applicata.
 */
export function calculateETF(input: ETFInput, scenario: ETFScenario): ETFOutput {
  const errori: string[] = [];
  const avvisi: string[] = [];

  if (input.anniOrizzonte <= 0 || !Number.isFinite(input.anniOrizzonte)) {
    errori.push("La durata del piano deve essere di almeno un anno.");
  }
  if (input.anniVersamento < 0) errori.push("Gli anni di versamento non possono essere negativi.");
  if (input.capitaleIniziale < 0) errori.push("Il capitale iniziale non può essere negativo.");
  if (input.versamentoMensile < 0) errori.push("Il versamento mensile non può essere negativo.");
  if (input.costoAnnuo < 0) errori.push("Il costo annuo non può essere negativo.");
  if (input.commissione < 0) errori.push("La commissione non può essere negativa.");
  if (scenario.rendimento <= -1) errori.push("Il rendimento annuo deve essere superiore a −100%.");

  if (errori.length > 0) {
    return { risultato: null, dettaglio: [], ipotesi: [], avvisi, errori };
  }

  const rm = monthlyRateFromAnnual(scenario.rendimento);
  const costoMensile = input.costoAnnuo / 12;
  const mesiTotali = Math.round(input.anniOrizzonte * 12);
  const mesiVersamento = Math.round(Math.min(input.anniVersamento, input.anniOrizzonte) * 12);

  let capitale = input.capitaleIniziale;
  let versamentiCumulati = 0;
  let rendimentoLordoCumulato = 0;
  let commissioniCumulate = 0;
  let costiGestioneCumulati = 0;

  const dettaglio: ETFYearRow[] = [];
  let capitaleInizioAnno = capitale;
  let versamentiAnno = 0;
  let rendimentoAnno = 0;
  let costiAnno = 0;

  for (let m = 0; m < mesiTotali; m++) {
    const annoIndice = Math.floor(m / 12);

    // 1-2. Versamento e commissione
    if (m < mesiVersamento) {
      const versamento = input.versamentoMensile * Math.pow(1 + input.incrementoVersamento, annoIndice);
      if (versamento > 0) {
        capitale += versamento;
        versamentiCumulati += versamento;
        versamentiAnno += versamento;
        const commissione = Math.min(input.commissione, capitale);
        capitale -= commissione;
        commissioniCumulate += commissione;
        costiAnno += commissione;
      }
    }

    // 3. Crescita lorda
    const crescita = capitale * rm;
    capitale += crescita;
    rendimentoLordoCumulato += crescita;
    rendimentoAnno += crescita;

    // 4. Costo annuo in proporzione mensile
    const costo = Math.max(0, capitale) * costoMensile;
    capitale -= costo;
    costiGestioneCumulati += costo;
    costiAnno += costo;

    if (capitale < 0) capitale = 0;

    // Chiusura dell'anno
    if ((m + 1) % 12 === 0 || m === mesiTotali - 1) {
      const anniTrascorsi = (m + 1) / 12;
      dettaglio.push({
        annoIndice,
        anno: input.annoIniziale + annoIndice,
        eta: input.etaIniziale + annoIndice,
        capitaleIniziale: capitaleInizioAnno,
        versamentiAnno,
        versamentiCumulati,
        rendimentoLordoAnno: rendimentoAnno,
        rendimentoLordoCumulato,
        costiAnno,
        costiCumulati: commissioniCumulate + costiGestioneCumulati,
        commissioniCumulate,
        costiGestioneCumulati,
        capitaleFinale: capitale,
        capitaleFinaleReale: calculateRealValue(capitale, input.inflazione, anniTrascorsi),
      });
      capitaleInizioAnno = capitale;
      versamentiAnno = 0;
      rendimentoAnno = 0;
      costiAnno = 0;
    }
  }

  const totaleInvestito = input.capitaleIniziale + versamentiCumulati;
  const costiTotali = commissioniCumulate + costiGestioneCumulati;

  if (input.anniVersamento > input.anniOrizzonte) {
    avvisi.push("Gli anni di versamento superano l'orizzonte fino all'età di utilizzo: i versamenti successivi non sono considerati.");
  }
  if (input.costoAnnuo >= scenario.rendimento && scenario.rendimento >= 0 && input.costoAnnuo > 0) {
    avvisi.push(`Nello scenario ${scenario.nome.toLowerCase()} i costi annui sono pari o superiori al rendimento ipotizzato.`);
  }
  if (input.commissione > 0 && input.versamentoMensile > 0 && input.commissione >= input.versamentoMensile) {
    avvisi.push("La commissione per versamento è pari o superiore al versamento stesso.");
  }
  if (capitale < totaleInvestito) {
    avvisi.push(
      `Nello scenario ${scenario.nome.toLowerCase()} il capitale finale (${formatEuro(capitale)}) è inferiore a quanto investito (${formatEuro(totaleInvestito)}).`,
    );
  }

  const ipotesi: Assumption[] = [
    { id: `rendimento-${scenario.id}`, etichetta: `Rendimento annuo lordo (${scenario.nome.toLowerCase()})`, valore: formatPercent(scenario.rendimento * 100), categoria: "incerto" },
    { id: "rendimento-mensile", etichetta: "Rendimento mensile equivalente", valore: formatPercent(rm * 100, 4), categoria: "ipotesi", nota: "(1 + r)^(1/12) − 1" },
    { id: "costo-annuo", etichetta: "Costo annuo dello strumento", valore: formatPercent(input.costoAnnuo * 100), categoria: "ipotesi", nota: "Applicato ogni mese come costo annuo ÷ 12" },
    { id: "commissione", etichetta: "Commissione per versamento", valore: formatEuro(input.commissione, true), categoria: "ipotesi" },
    { id: "inflazione", etichetta: "Inflazione annua", valore: formatPercent(input.inflazione * 100), categoria: "incerto" },
  ];

  return {
    risultato: {
      scenario,
      capitaleFinale: capitale,
      capitaleFinaleReale: calculateRealValue(capitale, input.inflazione, input.anniOrizzonte),
      versamentiTotali: versamentiCumulati,
      totaleInvestito,
      rendimentoLordoTotale: rendimentoLordoCumulato,
      costiGestioneTotali: costiGestioneCumulati,
      commissioniTotali: commissioniCumulate,
      costiTotali,
      sottoInvestito: capitale < totaleInvestito,
    },
    dettaglio,
    ipotesi,
    avvisi,
    errori,
  };
}

/** Costruisce i tre scenari didattici attorno al rendimento centrale scelto dall'utente. */
export function buildETFScenarios(
  rendimentoCentrale: number,
  spread: { prudente: number; favorevole: number },
): Record<"prudente" | "centrale" | "favorevole", ETFScenario> {
  return {
    prudente: { id: "prudente", nome: "Prudente", rendimento: rendimentoCentrale + spread.prudente },
    centrale: { id: "centrale", nome: "Centrale", rendimento: rendimentoCentrale },
    favorevole: { id: "favorevole", nome: "Favorevole", rendimento: rendimentoCentrale + spread.favorevole },
  };
}

/** Calcola i tre scenari. `spread` è in forma decimale (es. −0.02 / +0.02). */
export function calculateETFScenarios(
  input: ETFInput,
  rendimentoCentrale: number,
  spread: { prudente: number; favorevole: number },
): ETFScenariosOutput {
  const s = buildETFScenarios(rendimentoCentrale, spread);
  return {
    prudente: calculateETF(input, s.prudente),
    centrale: calculateETF(input, s.centrale),
    favorevole: calculateETF(input, s.favorevole),
  };
}

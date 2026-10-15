import { pensionParameters, getConfiguredRate, type PensionParametersConfig } from "@/config/pensionParameters";
import { AUTO_VALUES, SCENARIO_SPREAD } from "@/config/simulationDefaults";
import { getPlatform } from "@/config/investmentPlatforms";
import { calculatePension, toPensionEngineParameters } from "@/lib/pension/calculatePension";
import type { PensionInput, PensionOutput } from "@/lib/pension/pensionTypes";
import { calculateETFScenarios } from "@/lib/etf/calculateETF";
import type { ETFInput, ETFScenariosOutput } from "@/lib/etf/etfTypes";
import { calculateRetirementIncome, type RetirementIncomeResult } from "@/lib/retirement/calculateRetirementIncome";
import { calculateRealValue } from "@/lib/inflation/calculateRealValue";
import { computeCompleteness, type CompletenessResult } from "./completeness";
import { getInputWarnings, type InputWarning } from "@/lib/validation/warnings";
import type { SimulationInput } from "@/lib/validation/schemas";
import type { Assumption } from "@/lib/types";
import { formatEuro, formatPercent } from "@/lib/format";

/** Punto del grafico principale (valori a inizio età). */
export interface ChartPoint {
  eta: number;
  anno: number;
  stipendio: number | null;
  contributi: number | null;
  montante: number | null;
  montanteReale: number | null;
  senzaContributi: boolean;
  etfCentrale: number | null;
  etfPrudente: number | null;
  etfFavorevole: number | null;
  etfRange: [number, number] | null;
  versamentiCumulati: number | null;
  rendimentiCumulati: number | null;
  costiCumulati: number | null;
  etfCentraleReale: number | null;
  etfPrudenteReale: number | null;
  etfFavorevoleReale: number | null;
  etfRangeReale: [number, number] | null;
  versamentiCumulatiReali: number | null;
}

export interface RetirementIncomeSummary {
  anniAllaPensione: number;
  /** Media mensile su 12 mesi della pensione (annua ÷ 12), nominale. */
  pensioneMediaMensile: number;
  pensioneMediaMensileReale: number;
  /** Pensione di invalidità indicata dall'utente (0 se assente). */
  invaliditaMensile: number;
  invaliditaMensileReale: number;
  etfMensile: number;
  etfMensileReale: number;
  totaleMensile: number;
  totaleMensileReale: number;
  /** Reddito desiderato in euro di oggi. */
  desideratoReale: number;
  /** Reddito desiderato espresso in euro dell'anno di pensionamento. */
  desideratoNominale: number;
  gapReale: number;
  gapNominale: number;
  coperturaPercentuale: number;
  prelievoNominale: RetirementIncomeResult;
  prelievoReale: RetirementIncomeResult;
}

/** Valori automatici effettivamente usati nel calcolo (in punti percentuali / euro). */
export interface AutoValuesUsed {
  aliquota: number;
  rivalutazione: number;
  inflazione: number;
  rendimentoETF: number;
  costoAnnuoETF: number;
  commissionePAC: number;
  piattaforma: string;
  etaUtilizzo: number;
}

export interface SimulationResult {
  calcolatoIl: string;
  input: SimulationInput;
  annoCorrente: number;
  etfAttivo: boolean;
  valoriAutomatici: AutoValuesUsed;
  pensione: PensionOutput;
  etf: ETFScenariosOutput;
  reddito: RetirementIncomeSummary;
  serie: ChartPoint[];
  ipotesi: Assumption[];
  avvisi: string[];
  avvisiInput: InputWarning[];
  errori: string[];
  completezza: CompletenessResult;
}

/** Età in cui l'utente userà il capitale ETF (alla pensione, salvo scelta diversa). */
export function getEtaUtilizzo(input: SimulationInput): number {
  return input.etf.utilizzoAllaPensione ? input.personal.etaPensionamento : input.etf.etaUtilizzo;
}

/** Anni da oggi prima di iniziare a lavorare (solo per chi studia). */
export function getAnniPrimaDelLavoro(input: SimulationInput): number {
  if (input.personal.categoria !== "studente" || input.career.etaInizioLavoro === undefined) return 0;
  return Math.max(0, input.career.etaInizioLavoro - input.personal.eta);
}

/** Traduce l'input dell'interfaccia (percentuali) nell'input del motore pensionistico (decimali). */
export function toPensionInput(
  input: SimulationInput,
  annoCorrente: number,
  params: PensionParametersConfig = pensionParameters,
): PensionInput {
  const { personal, career, contributions } = input;
  const anniAllaPensione = personal.etaPensionamento - personal.eta;
  const ritardo = getAnniPrimaDelLavoro(input);
  const anniLavoro =
    personal.categoria === "studente" ? Math.max(0, anniAllaPensione - ritardo) : Math.min(career.anniFuturi, anniAllaPensione);
  return {
    etaAttuale: personal.eta,
    annoCorrente,
    etaPensionamento: personal.etaPensionamento,
    stipendioAnnuo: career.stipendioAnnuo,
    crescitaStipendio: career.crescitaStipendio / 100,
    aliquota: getConfiguredRate(personal.categoria, params) / 100,
    // Il montante attuale viene sempre stimato dagli anni di contributi.
    montanteIniziale: null,
    anniContributiPassati: Math.max(0, contributions.anniContributi + contributions.mesiContributi / 12),
    rivalutazione: params.rivalutazioneDefault.valore / 100,
    rivalutaInPausa: params.rivalutaAnniSenzaContributi.valore,
    anniPrimaDelLavoro: ritardo,
    anniLavoroFuturi: anniLavoro,
    etaSenzaContributi: [],
    coefficienteOverride: null,
    inflazione: AUTO_VALUES.inflazione.valore / 100,
  };
}

/** Traduce l'input dell'interfaccia nell'input del motore ETF (valori automatici inclusi). */
export function toETFInput(input: SimulationInput, annoCorrente: number): ETFInput {
  const { personal, etf } = input;
  const orizzonte = Math.max(1, getEtaUtilizzo(input) - personal.eta);
  const attivo = etf.attivo;
  return {
    capitaleIniziale: attivo ? etf.capitaleIniziale : 0,
    versamentoMensile: attivo ? etf.versamentoMensile : 0,
    anniVersamento: Math.min(etf.anni, orizzonte),
    anniOrizzonte: orizzonte,
    costoAnnuo: AUTO_VALUES.costoAnnuoETF.valore / 100,
    commissione: attivo ? getPlatform(etf.piattaforma).commissionePAC : 0,
    inflazione: AUTO_VALUES.inflazione.valore / 100,
    incrementoVersamento: etf.incrementoVersamento / 100,
    etaIniziale: personal.eta,
    annoIniziale: annoCorrente,
  };
}

/**
 * Esegue l'intera simulazione: pensione, tre scenari ETF (se il piano è attivo), reddito futuro,
 * gap, serie per i grafici, ipotesi, avvisi e completezza.
 * Funzione pura: a parità di input, parametri e data restituisce lo stesso risultato.
 */
export function runSimulation(
  input: SimulationInput,
  params: PensionParametersConfig = pensionParameters,
  now: Date = new Date(),
): SimulationResult {
  const annoCorrente = now.getFullYear();
  const inflazione = AUTO_VALUES.inflazione.valore / 100;
  const etfAttivo = input.etf.attivo;
  const etaUtilizzo = getEtaUtilizzo(input);
  const platform = getPlatform(input.etf.piattaforma);

  const pensione = calculatePension(toPensionInput(input, annoCorrente, params), toPensionEngineParameters(params));
  const etfInput = toETFInput(input, annoCorrente);
  const etf = calculateETFScenarios(etfInput, AUTO_VALUES.rendimentoETF.valore / 100, {
    prudente: SCENARIO_SPREAD.prudente / 100,
    favorevole: SCENARIO_SPREAD.favorevole / 100,
  });

  // Reddito futuro: confronto in media mensile su 12 mesi
  const anniAllaPensione = input.personal.etaPensionamento - input.personal.eta;
  const fattore = Math.pow(1 + inflazione, anniAllaPensione);
  const pensioneAnnua = pensione.risultato?.pensioneAnnuaLorda ?? 0;
  const pensioneMediaMensile = pensioneAnnua / 12;
  const pensioneMediaMensileReale = calculateRealValue(pensioneMediaMensile, inflazione, anniAllaPensione);

  const invaliditaMensileReale = input.personal.pensioneInvalidita ? (input.personal.importoInvalidita ?? 0) : 0;
  const invaliditaMensile = invaliditaMensileReale * fattore;

  const capitaleCentrale = etfAttivo ? (etf.centrale.risultato?.capitaleFinale ?? 0) : 0;
  const capitaleCentraleReale = etfAttivo ? (etf.centrale.risultato?.capitaleFinaleReale ?? 0) : 0;
  const withdrawalOptions = {
    modalita: etfAttivo ? input.withdrawal.modalita : ("nessuna" as const),
    anni: input.withdrawal.anni,
    percentuale: input.withdrawal.percentuale / 100,
    rendimento: AUTO_VALUES.rendimentoPrelievo.valore / 100,
  };
  // In valori reali il rendimento durante il prelievo è un rendimento al netto dell'inflazione.
  const prelievoReale = calculateRetirementIncome(capitaleCentraleReale, withdrawalOptions);
  const prelievoNominale = calculateRetirementIncome(capitaleCentrale, withdrawalOptions);

  const etfMensileReale = prelievoReale.prelievoMensile;
  const etfMensile = prelievoNominale.prelievoMensile;
  const totaleMensileReale = pensioneMediaMensileReale + invaliditaMensileReale + etfMensileReale;
  const desideratoReale = input.personal.redditoDesiderato;
  const gapReale = Math.max(0, desideratoReale - totaleMensileReale);

  const reddito: RetirementIncomeSummary = {
    anniAllaPensione,
    pensioneMediaMensile,
    pensioneMediaMensileReale,
    invaliditaMensile,
    invaliditaMensileReale,
    etfMensile,
    etfMensileReale,
    totaleMensile: pensioneMediaMensile + invaliditaMensile + etfMensile,
    totaleMensileReale,
    desideratoReale,
    desideratoNominale: desideratoReale * fattore,
    gapReale,
    gapNominale: gapReale * fattore,
    coperturaPercentuale: desideratoReale > 0 ? Math.min(999, (totaleMensileReale / desideratoReale) * 100) : 100,
    prelievoNominale,
    prelievoReale,
  };

  // Serie del grafico principale
  const serie: ChartPoint[] = [];
  const maxEta = etfAttivo ? Math.max(input.personal.etaPensionamento, etaUtilizzo) : input.personal.etaPensionamento;
  const rows = pensione.dettaglio;
  const etfC = etf.centrale.dettaglio;
  const etfP = etf.prudente.dettaglio;
  const etfF = etf.favorevole.dettaglio;
  const montanteIniziale = pensione.risultato?.montanteIniziale ?? 0;

  for (let eta = input.personal.eta; eta <= maxEta; eta++) {
    const k = eta - input.personal.eta;
    const defl = (v: number | null) => (v === null ? null : calculateRealValue(v, inflazione, k));
    const row = rows[k];
    const montante = k === 0 ? montanteIniziale : eta <= input.personal.etaPensionamento ? (rows[k - 1]?.montanteFinale ?? null) : null;

    const etfAt = (d: typeof etfC): number | null => {
      if (!etfAttivo) return null;
      return k === 0 ? input.etf.capitaleIniziale : (d[k - 1]?.capitaleFinale ?? null);
    };
    const c = etfAt(etfC);
    const p = etfAt(etfP);
    const f = etfAt(etfF);
    const prevC = k === 0 || !etfAttivo ? null : etfC[k - 1];
    const versamenti = !etfAttivo ? null : k === 0 ? 0 : (prevC?.versamentiCumulati ?? null);
    const range: [number, number] | null = p !== null && f !== null ? [Math.min(p, f), Math.max(p, f)] : null;

    serie.push({
      eta,
      anno: annoCorrente + k,
      stipendio: row ? row.stipendio : null,
      contributi: row ? row.contributi : null,
      montante,
      montanteReale: defl(montante),
      senzaContributi: row ? row.senzaContributi : false,
      etfCentrale: c,
      etfPrudente: p,
      etfFavorevole: f,
      etfRange: range,
      versamentiCumulati: versamenti,
      rendimentiCumulati: !etfAttivo ? null : k === 0 ? 0 : (prevC?.rendimentoLordoCumulato ?? null),
      costiCumulati: !etfAttivo ? null : k === 0 ? 0 : (prevC?.costiCumulati ?? null),
      etfCentraleReale: defl(c),
      etfPrudenteReale: defl(p),
      etfFavorevoleReale: defl(f),
      etfRangeReale: range ? [defl(range[0]) ?? 0, defl(range[1]) ?? 0] : null,
      versamentiCumulatiReali: defl(versamenti),
    });
  }

  const ipotesi: Assumption[] = [
    ...pensione.ipotesi,
    {
      id: "inflazione",
      etichetta: "Inflazione annua (automatica)",
      valore: formatPercent(AUTO_VALUES.inflazione.valore),
      categoria: "incerto",
      nota: "Obiettivo BCE di medio periodo",
    },
    { id: "fiscalita", etichetta: "Tassazione", valore: "Non applicata (importi lordi)", categoria: "regola" },
  ];
  if (input.personal.pensioneInvalidita) {
    ipotesi.push({
      id: "invalidita",
      etichetta: "Pensione di invalidità (indicata da te)",
      valore: `${formatEuro(invaliditaMensileReale)}/mese`,
      categoria: "certo",
      nota: "Considerata costante in euro di oggi; non calcolata dal simulatore",
    });
  }
  if (etfAttivo) {
    ipotesi.push(
      ...etf.centrale.ipotesi.filter((a) => !["rendimento-centrale", "inflazione", "costo-annuo", "commissione"].includes(a.id)),
      {
        id: "rendimento-scenari",
        etichetta: "Rendimento annuo lordo ETF (prudente / centrale / favorevole)",
        valore: `${formatPercent(AUTO_VALUES.rendimentoETF.valore + SCENARIO_SPREAD.prudente)} / ${formatPercent(AUTO_VALUES.rendimentoETF.valore)} / ${formatPercent(AUTO_VALUES.rendimentoETF.valore + SCENARIO_SPREAD.favorevole)}`,
        categoria: "incerto",
        nota: "Automatico, valori didattici: non previsioni",
      },
      {
        id: "costo-annuo",
        etichetta: "Costo annuo dello strumento (automatico)",
        valore: formatPercent(AUTO_VALUES.costoAnnuoETF.valore),
        categoria: "ipotesi",
        nota: "TER indicativo di un ETF globale a replica di indice",
      },
      {
        id: "commissione",
        etichetta: `Commissione per versamento (${platform.nome})`,
        valore: formatEuro(platform.commissionePAC, true),
        categoria: platform.affidabilita === "stima" ? "ipotesi" : "regola",
        nota: platform.affidabilita === "stima" ? "Stima automatica" : "Tariffa pubblica, automatica",
      },
      { id: "versamento", etichetta: "Versamento mensile ETF", valore: formatEuro(input.etf.versamentoMensile), categoria: "ipotesi" },
      { id: "incremento", etichetta: "Incremento annuo del versamento", valore: formatPercent(input.etf.incrementoVersamento), categoria: "ipotesi" },
      { id: "eta-utilizzo", etichetta: "Età in cui inizi a usare i soldi investiti", valore: `${etaUtilizzo} anni`, categoria: "ipotesi" },
      ...prelievoReale.ipotesi,
    );
  }
  ipotesi.push({
    id: "confronto-mensile",
    etichetta: "Confronto dei redditi",
    valore: "Media mensile su 12 mesi, in euro di oggi",
    categoria: "ipotesi",
    nota: "Pensione annua ÷ 12, per confrontarla con il reddito desiderato",
  });

  const errori = [...pensione.errori, ...(etfAttivo ? [...etf.centrale.errori, ...prelievoReale.errori] : [])];
  const avvisi = Array.from(
    new Set([
      ...pensione.avvisi,
      ...(etfAttivo ? [...etf.prudente.avvisi, ...etf.centrale.avvisi, ...etf.favorevole.avvisi, ...prelievoReale.avvisi] : []),
    ]),
  );

  return {
    calcolatoIl: now.toISOString(),
    input,
    annoCorrente,
    etfAttivo,
    valoriAutomatici: {
      aliquota: getConfiguredRate(input.personal.categoria, params),
      rivalutazione: params.rivalutazioneDefault.valore,
      inflazione: AUTO_VALUES.inflazione.valore,
      rendimentoETF: AUTO_VALUES.rendimentoETF.valore,
      costoAnnuoETF: AUTO_VALUES.costoAnnuoETF.valore,
      commissionePAC: platform.commissionePAC,
      piattaforma: platform.nome,
      etaUtilizzo,
    },
    pensione,
    etf,
    reddito,
    serie,
    ipotesi,
    avvisi,
    avvisiInput: getInputWarnings(input, params, now),
    errori,
    completezza: computeCompleteness(input, params),
  };
}

/* -------------------------------------------------------------------------- */
/* "Come cambia il tuo futuro?" — modifiche rapide                              */
/* -------------------------------------------------------------------------- */

export interface WhatIfOverrides {
  etaPensionamento?: number;
  versamentoMensile?: number;
  crescitaStipendio?: number;
}

/**
 * Applica le modifiche degli slider a una copia dell'input.
 * Se l'utente lavorava fino alla pensione, gli anni di lavoro seguono la nuova età.
 */
export function applyWhatIf(input: SimulationInput, o: WhatIfOverrides): SimulationInput {
  const next: SimulationInput = JSON.parse(JSON.stringify(input)) as SimulationInput;
  if (o.etaPensionamento !== undefined && o.etaPensionamento !== input.personal.etaPensionamento) {
    const oldYears = input.personal.etaPensionamento - input.personal.eta;
    const newYears = o.etaPensionamento - input.personal.eta;
    next.personal.etaPensionamento = o.etaPensionamento;
    if (input.career.anniFuturi >= oldYears) next.career.anniFuturi = newYears;
    if (input.etf.utilizzoAllaPensione && input.etf.anni >= oldYears) next.etf.anni = newYears;
  }
  if (o.versamentoMensile !== undefined) next.etf.versamentoMensile = o.versamentoMensile;
  if (o.crescitaStipendio !== undefined) {
    next.career.crescitaStipendio = o.crescitaStipendio;
    next.career.crescitaSconosciuta = false;
  }
  return next;
}

/* -------------------------------------------------------------------------- */
/* Confronto degli scenari salvati                                             */
/* -------------------------------------------------------------------------- */

export interface SavedScenario {
  id: string;
  nome: string;
  creatoIl: string;
  aggiornatoIl: string;
  input: SimulationInput;
}

export interface ScenarioComparisonRow {
  id: string;
  nome: string;
  etfAttivo: boolean;
  etaPensionamento: number;
  contributiFuturi: number;
  pensioneMensileLorda: number;
  pensioneMensileLordaReale: number;
  invaliditaMensileReale: number;
  versamentoMensile: number;
  capitaleETF: number;
  capitaleETFReale: number;
  capitaleETFPrudente: number;
  capitaleETFFavorevole: number;
  /** Pensione annua ÷ 12, in euro di oggi. */
  pensioneMediaMensileReale: number;
  redditoComplessivoReale: number;
  desideratoReale: number;
  gapReale: number;
  errori: string[];
}

export function compareScenarios(
  scenarios: SavedScenario[],
  params: PensionParametersConfig = pensionParameters,
  now: Date = new Date(),
): ScenarioComparisonRow[] {
  return scenarios.map((s) => {
    const r = runSimulation(s.input, params, now);
    return {
      id: s.id,
      nome: s.nome,
      etfAttivo: r.etfAttivo,
      etaPensionamento: s.input.personal.etaPensionamento,
      contributiFuturi: r.pensione.risultato?.contributiFuturiTotali ?? 0,
      pensioneMensileLorda: r.pensione.risultato?.pensioneMensileLorda ?? 0,
      pensioneMensileLordaReale: r.pensione.risultato?.pensioneMensileLordaReale ?? 0,
      invaliditaMensileReale: r.reddito.invaliditaMensileReale,
      versamentoMensile: r.etfAttivo ? s.input.etf.versamentoMensile : 0,
      capitaleETF: r.etfAttivo ? (r.etf.centrale.risultato?.capitaleFinale ?? 0) : 0,
      capitaleETFReale: r.etfAttivo ? (r.etf.centrale.risultato?.capitaleFinaleReale ?? 0) : 0,
      capitaleETFPrudente: r.etfAttivo ? (r.etf.prudente.risultato?.capitaleFinale ?? 0) : 0,
      capitaleETFFavorevole: r.etfAttivo ? (r.etf.favorevole.risultato?.capitaleFinale ?? 0) : 0,
      pensioneMediaMensileReale: r.reddito.pensioneMediaMensileReale,
      redditoComplessivoReale: r.reddito.totaleMensileReale,
      desideratoReale: r.reddito.desideratoReale,
      gapReale: r.reddito.gapReale,
      errori: r.errori,
    };
  });
}

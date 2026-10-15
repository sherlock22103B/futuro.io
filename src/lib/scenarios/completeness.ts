import { HYPOTHESIS_DEFAULTS } from "@/config/simulationDefaults";
import { pensionParameters, type PensionParametersConfig } from "@/config/pensionParameters";
import { getPlatform } from "@/config/investmentPlatforms";
import type { SimulationInput } from "@/lib/validation/schemas";
import type { DataCategory } from "@/lib/types";

export type CompletenessStatus = "inserito" | "mancante" | "predefinito" | "da_verificare" | "automatico";

export interface CompletenessItem {
  campo: string;
  etichetta: string;
  categoria: DataCategory;
  stato: CompletenessStatus;
}

export interface CompletenessResult {
  /** % di campi il cui valore è stato inserito direttamente dall'utente. */
  percentualeDatiUtente: number;
  /** % di dati documentabili (dati certi) effettivamente inseriti. */
  percentualeDatiDocumentati: number;
  /** % di parametri e valori automatici che hanno un valore configurato. */
  percentualeParametriConfigurati: number;
  /** % di parametri e valori automatici verificati su una fonte (non demo/stima). */
  percentualeParametriVerificati: number;
  /** % di ipotesi modificabili lasciate ai valori predefiniti. */
  percentualeIpotesiPredefinite: number;
  inseriti: CompletenessItem[];
  mancanti: CompletenessItem[];
  predefiniti: CompletenessItem[];
  automatici: CompletenessItem[];
  daVerificare: CompletenessItem[];
  totaleCampi: number;
  isDemo: boolean;
}

const pct = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 100));
const same = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/**
 * Indicatore di COMPLETEZZA della simulazione.
 * Misura solo quanti campi sono stati compilati e da dove provengono i valori.
 * NON è una probabilità che il risultato si realizzi.
 */
export function computeCompleteness(
  input: SimulationInput,
  params: PensionParametersConfig = pensionParameters,
): CompletenessResult {
  const items: CompletenessItem[] = [];
  const { personal, career, contributions, etf } = input;

  // DATI CERTI inseriti dall'utente
  const certi: [string, string, unknown][] = [
    ["personal.eta", "Età", personal.eta],
    ["career.stipendioAnnuo", personal.categoria === "studente" ? "Stipendio iniziale previsto" : "Stipendio lordo annuo", career.stipendioAnnuo],
    ["contributions.anniContributi", "Anni di contributi", contributions.anniContributi],
  ];
  if (personal.pensioneInvalidita) certi.push(["personal.importoInvalidita", "Pensione di invalidità", personal.importoInvalidita]);
  if (etf.attivo) {
    certi.push(["etf.capitaleIniziale", "Capitale ETF già posseduto", etf.capitaleIniziale]);
    certi.push(["etf.versamentiEffettuati", "Versamenti ETF già effettuati", etf.versamentiEffettuati]);
  }
  for (const [campo, etichetta, value] of certi) {
    items.push({ campo, etichetta, categoria: "certo", stato: value === undefined || value === null ? "mancante" : "inserito" });
  }

  // VALORI AUTOMATICI (non modificabili): verificati o da verificare
  const auto: { campo: string; etichetta: string; categoria: DataCategory; verificato: boolean }[] = [
    { campo: "auto.aliquota", etichetta: "Aliquota contributiva", categoria: "regola", verificato: params.aliquotePerCategoria[personal.categoria].stato === "verificato" },
    { campo: "auto.coefficiente", etichetta: "Coefficiente di trasformazione", categoria: "regola", verificato: params.coefficientiTrasformazione.stato === "verificato" },
    { campo: "auto.etaPensionabile", etichetta: "Età pensionabile di riferimento", categoria: "regola", verificato: params.etaPensionabile.stato === "verificato" },
    { campo: "auto.mensilita", etichetta: "Mensilità della pensione", categoria: "regola", verificato: params.mensilitaPensione.stato === "verificato" },
    { campo: "auto.rivalutazione", etichetta: "Rivalutazione del montante", categoria: "incerto", verificato: params.rivalutazioneDefault.stato === "verificato" },
    { campo: "auto.montante", etichetta: "Montante già maturato (stimato)", categoria: "certo", verificato: false },
    { campo: "auto.inflazione", etichetta: "Inflazione (obiettivo BCE)", categoria: "incerto", verificato: true },
    { campo: "auto.fiscalita", etichetta: "Trattamento fiscale (non applicato)", categoria: "regola", verificato: false },
  ];
  if (etf.attivo) {
    const platform = getPlatform(etf.piattaforma);
    auto.push(
      { campo: "auto.rendimento", etichetta: "Rendimento ETF (didattico)", categoria: "incerto", verificato: false },
      { campo: "auto.costoAnnuo", etichetta: "Costo annuo dello strumento", categoria: "ipotesi", verificato: false },
      { campo: "auto.commissione", etichetta: `Commissione per versamento (${platform.nome})`, categoria: "regola", verificato: platform.affidabilita === "fonte_pubblica" },
    );
  }
  for (const a of auto) {
    items.push({ campo: a.campo, etichetta: a.etichetta, categoria: a.categoria, stato: a.verificato ? "automatico" : "da_verificare" });
  }

  // IPOTESI modificabili dall'utente
  const ipotesi: [string, string, boolean][] = [
    ["career.crescitaStipendio", "Crescita dello stipendio", career.crescitaSconosciuta || same(career.crescitaStipendio, HYPOTHESIS_DEFAULTS.crescitaStipendio)],
  ];
  if (etf.attivo) {
    ipotesi.push(
      ["etf.versamentoMensile", "Versamento mensile", same(etf.versamentoMensile, HYPOTHESIS_DEFAULTS.versamentoMensile)],
      ["etf.incrementoVersamento", "Incremento annuo del versamento", same(etf.incrementoVersamento, HYPOTHESIS_DEFAULTS.incrementoVersamento)],
      ["etf.piattaforma", "Dove investi", etf.piattaforma === HYPOTHESIS_DEFAULTS.piattaforma],
    );
  }
  for (const [campo, etichetta, isDefault] of ipotesi) {
    items.push({ campo, etichetta, categoria: "ipotesi", stato: isDefault ? "predefinito" : "inserito" });
  }

  const certiItems = items.filter((i) => i.categoria === "certo" && !i.campo.startsWith("auto."));
  const autoItems = items.filter((i) => i.campo.startsWith("auto."));
  const ipotesiItems = items.filter((i) => !i.campo.startsWith("auto.") && i.categoria === "ipotesi");
  const inseriti = items.filter((i) => i.stato === "inserito");
  const autoConValore = autoItems.filter((i) => i.campo !== "auto.fiscalita");

  return {
    percentualeDatiUtente: pct(inseriti.length, items.length),
    percentualeDatiDocumentati: pct(certiItems.filter((i) => i.stato === "inserito").length, certiItems.length),
    percentualeParametriConfigurati: pct(autoConValore.length, autoItems.length),
    percentualeParametriVerificati: pct(autoConValore.filter((i) => i.stato === "automatico").length, autoConValore.length),
    percentualeIpotesiPredefinite: pct(ipotesiItems.filter((i) => i.stato === "predefinito").length, ipotesiItems.length),
    inseriti,
    mancanti: items.filter((i) => i.stato === "mancante"),
    predefiniti: items.filter((i) => i.stato === "predefinito"),
    automatici: items.filter((i) => i.stato === "automatico"),
    daVerificare: items.filter((i) => i.stato === "da_verificare"),
    totaleCampi: items.length,
    isDemo: input.meta.isDemo,
  };
}

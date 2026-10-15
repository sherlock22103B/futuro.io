import { SIMULATION_LIMITS as L } from "@/config/simulationDefaults";
import { pensionParameters, type PensionParametersConfig } from "@/config/pensionParameters";
import { getPlatform } from "@/config/investmentPlatforms";
import type { SimulationInput } from "./schemas";
import { formatPercent } from "@/lib/format";

export interface InputWarning {
  campo: string;
  messaggio: string;
}

/**
 * Avvisi su valori validi ma insoliti. Non correggono nulla: informano.
 */
export function getInputWarnings(
  input: SimulationInput,
  params: PensionParametersConfig = pensionParameters,
  now: Date = new Date(),
): InputWarning[] {
  const w: InputWarning[] = [];
  const { personal, career, contributions, etf } = input;
  const anniAllaPensione = personal.etaPensionamento - personal.eta;
  const studente = personal.categoria === "studente";

  const annoAtteso = now.getFullYear() - personal.eta;
  if (Math.abs(annoAtteso - personal.annoNascita) > 1) {
    w.push({
      campo: "personal.annoNascita",
      messaggio: `L'anno di nascita (${personal.annoNascita}) non corrisponde all'età indicata (${personal.eta} anni). Controlla i due valori.`,
    });
  }

  if (personal.categoria === "non_so") {
    w.push({ campo: "personal.categoria", messaggio: "Categoria non indicata: viene usata un'aliquota dimostrativa. Il risultato è solo indicativo." });
  }
  if (studente) {
    w.push({
      campo: "personal.categoria",
      messaggio: `Per chi studia si ipotizza un futuro lavoro dipendente a partire da ${career.etaInizioLavoro ?? "—"} anni, con lo stipendio iniziale che hai indicato.`,
    });
  }
  if (personal.pensioneInvalidita) {
    w.push({
      campo: "personal.importoInvalidita",
      messaggio: "La pensione di invalidità non è calcolata dal simulatore: viene sommata così come l'hai indicata. Requisiti, durata ed eventuale trasformazione in pensione di vecchiaia vanno verificati con l'ente previdenziale.",
    });
  }

  const coeffAges = Object.keys(params.coefficientiTrasformazione.valore).map(Number);
  const minAge = Math.min(...coeffAges);
  const maxAge = Math.max(...coeffAges);
  if (personal.etaPensionamento < minAge || personal.etaPensionamento > maxAge) {
    w.push({
      campo: "personal.etaPensionamento",
      messaggio: `I coefficienti configurati vanno da ${minAge} a ${maxAge} anni: per ${personal.etaPensionamento} anni verrà usato il valore più vicino.`,
    });
  }
  if (personal.etaPensionamento < params.etaPensionabile.valore) {
    w.push({
      campo: "personal.etaPensionamento",
      messaggio: `Hai scelto un'età inferiore a quella di riferimento configurata (${params.etaPensionabile.valore} anni). L'uscita anticipata richiede requisiti specifici non verificati dal simulatore.`,
    });
  }

  if (career.crescitaStipendio > L.crescitaAvviso) {
    w.push({
      campo: "career.crescitaStipendio",
      messaggio: `Una crescita dello stipendio del ${formatPercent(career.crescitaStipendio)} ogni anno per tutta la carriera è un'ipotesi molto ottimistica.`,
    });
  }
  if (career.crescitaStipendio < 0) {
    w.push({ campo: "career.crescitaStipendio", messaggio: "Hai ipotizzato uno stipendio in calo ogni anno." });
  }
  if (!studente) {
    if (career.anniFuturi > anniAllaPensione) {
      w.push({
        campo: "career.anniFuturi",
        messaggio: `Gli anni di lavoro previsti (${career.anniFuturi}) superano gli anni che mancano alla pensione (${anniAllaPensione}): vengono considerati solo questi ultimi.`,
      });
    } else if (career.anniFuturi < anniAllaPensione) {
      w.push({
        campo: "career.anniFuturi",
        messaggio: `Lavorerai ${career.anniFuturi} anni su ${anniAllaPensione} prima della pensione: gli anni restanti sono considerati senza contributi.`,
      });
    }
  }
  if (career.stipendioAnnuo === 0) {
    w.push({ campo: "career.stipendioAnnuo", messaggio: "Con stipendio pari a zero non vengono calcolati nuovi contributi." });
  }

  if (contributions.altreGestioni) {
    w.push({
      campo: "contributions.altreGestioni",
      messaggio: "Hai contributi in altre gestioni: il simulatore non li somma automaticamente. Serve una verifica specifica.",
    });
  }

  if (etf.attivo) {
    const platform = getPlatform(etf.piattaforma);
    if (platform.affidabilita === "stima") {
      w.push({ campo: "etf.piattaforma", messaggio: `La commissione per «${platform.nome}» è una stima: controlla le condizioni reali della tua banca.` });
    }
    if (platform.commissionePAC > 0 && etf.versamentoMensile > 0 && platform.commissionePAC / etf.versamentoMensile > 0.02) {
      w.push({
        campo: "etf.versamentoMensile",
        messaggio: `Con ${platform.nome} la commissione assorbe il ${formatPercent((platform.commissionePAC / etf.versamentoMensile) * 100, 1)} di ogni versamento.`,
      });
    }
    const etaUtilizzo = etf.utilizzoAllaPensione ? personal.etaPensionamento : etf.etaUtilizzo;
    const orizzonte = etaUtilizzo - personal.eta;
    if (etf.anni > orizzonte) {
      w.push({
        campo: "etf.anni",
        messaggio: `Il piano dura ${etf.anni} anni ma inizierai a usare i soldi tra ${orizzonte}: i versamenti successivi non sono considerati.`,
      });
    }
    if (etf.versamentoMensile === 0 && etf.capitaleIniziale === 0) {
      w.push({ campo: "etf.versamentoMensile", messaggio: "Senza capitale iniziale né versamenti il piano ETF resta a zero." });
    }
  }

  return w;
}

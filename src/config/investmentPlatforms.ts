/**
 * PIATTAFORME PER IL PIANO DI ACCUMULO (PAC) IN ETF
 * ------------------------------------------------------------------
 * Commissione applicata a ogni rata del PAC, usata automaticamente dal simulatore.
 *
 * Fonte principale: confronto pubblico dei piani di accumulo in ETF di justETF,
 * dati dichiarati aggiornati al 12 ottobre 2026 (consultato il 14 ottobre 2026).
 * Le tariffe cambiano spesso e possono dipendere dall'ETF scelto o da promozioni:
 * vanno ricontrollate periodicamente sul sito di ciascun intermediario.
 *
 * FUTURO.IO non consiglia né promuove alcun intermediario: l'elenco serve solo
 * a stimare i costi in modo realistico.
 */

export type PlatformReliability = "fonte_pubblica" | "stima";

export interface InvestmentPlatform {
  id: string;
  nome: string;
  /** Commissione in euro per ogni rata del PAC (rata da 100 €). */
  commissionePAC: number;
  nota?: string;
  affidabilita: PlatformReliability;
}

export const PLATFORM_SOURCE = {
  nome: "justETF — Confronto tra piani di accumulo in ETF",
  url: "https://www.justetf.com/it/etf-sparplan/sparplan-vergleich.html",
  datiAggiornatiAl: "2026-10-12",
  consultatoIl: "2026-10-14",
} as const;

export const investmentPlatforms: InvestmentPlatform[] = [
  { id: "trade_republic", nome: "Trade Republic", commissionePAC: 0, affidabilita: "fonte_pubblica" },
  { id: "scalable", nome: "Scalable Capital", commissionePAC: 0, affidabilita: "fonte_pubblica" },
  {
    id: "fineco",
    nome: "Fineco",
    commissionePAC: 2.95,
    nota: "Gratuito sugli ETF inclusi nella lista a zero commissioni: qui si usa la tariffa standard.",
    affidabilita: "fonte_pubblica",
  },
  { id: "directa", nome: "Directa", commissionePAC: 0, nota: "Il PAC va attivato direttamente con l'intermediario.", affidabilita: "fonte_pubblica" },
  { id: "revolut", nome: "Revolut", commissionePAC: 0, affidabilita: "fonte_pubblica" },
  { id: "satispay", nome: "Satispay", commissionePAC: 0.89, affidabilita: "fonte_pubblica" },
  {
    id: "banca_tradizionale",
    nome: "Banca tradizionale (es. sportello/home banking della tua banca)",
    commissionePAC: 3.5,
    nota: "STIMA: le tariffe delle grandi banche tradizionali non sono pubblicate in modo confrontabile. Controlla il foglio informativo della tua banca.",
    affidabilita: "stima",
  },
  {
    id: "non_so",
    nome: "Non so / altro",
    commissionePAC: 3.5,
    nota: "STIMA prudente, uguale a quella della banca tradizionale.",
    affidabilita: "stima",
  },
];

export const PLATFORM_IDS = investmentPlatforms.map((p) => p.id) as [string, ...string[]];

export function getPlatform(id: string | undefined): InvestmentPlatform {
  return investmentPlatforms.find((p) => p.id === id) ?? investmentPlatforms[investmentPlatforms.length - 1];
}

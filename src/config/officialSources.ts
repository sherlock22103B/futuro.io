/**
 * Fonti istituzionali di riferimento. Le descrizioni sono originali e sintetiche.
 * I link puntano alle home page ufficiali: le pagine interne possono cambiare.
 */
export interface OfficialSource {
  id: string;
  nome: string;
  url: string;
  descrizione: string;
  ambito: string;
}

export const officialSources: OfficialSource[] = [
  {
    id: "inps",
    nome: "INPS",
    url: "https://www.inps.it",
    descrizione:
      "Ente che gestisce la previdenza pubblica. Dall'area personale puoi consultare il tuo estratto conto contributivo e i servizi di simulazione ufficiali.",
    ambito: "Contributi, montante, requisiti, coefficienti di trasformazione",
  },
  {
    id: "covip",
    nome: "COVIP",
    url: "https://www.covip.it",
    descrizione:
      "Autorità di vigilanza sui fondi pensione. Pubblica guide introduttive e materiali per capire la previdenza complementare.",
    ambito: "Previdenza complementare e fondi pensione",
  },
  {
    id: "lavoro",
    nome: "Ministero del Lavoro e delle Politiche Sociali",
    url: "https://www.lavoro.gov.it",
    descrizione:
      "Ministero competente in materia previdenziale. Tra le sue attività rientra l'aggiornamento periodico dei coefficienti di trasformazione.",
    ambito: "Normativa previdenziale e decreti attuativi",
  },
  {
    id: "consob",
    nome: "CONSOB",
    url: "https://www.consob.it",
    descrizione:
      "Autorità di vigilanza sui mercati finanziari. Offre materiali di educazione finanziaria su rischi, costi e funzionamento degli investimenti.",
    ambito: "Strumenti finanziari, ETF, tutela degli investitori",
  },
  {
    id: "bancaditalia",
    nome: "Banca d'Italia",
    url: "https://www.bancaditalia.it",
    descrizione:
      "Banca centrale italiana. Pubblica statistiche ufficiali e contenuti di educazione finanziaria su inflazione, risparmio e tassi.",
    ambito: "Inflazione, educazione finanziaria, statistiche",
  },
];

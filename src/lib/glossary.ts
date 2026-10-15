import type { DataCategory } from "@/lib/types";

export interface GlossaryEntry {
  termine: string;
  definizione: string;
  origine: string;
  categoria: DataCategory;
}

/**
 * Definizioni semplici dei termini tecnici, con origine del dato e categoria.
 * Usate dai tooltip informativi accanto a ogni campo.
 */
export const glossary = {
  eta: {
    termine: "Età attuale",
    definizione: "Gli anni che hai compiuto oggi. Serve a capire quanti anni mancano alla pensione.",
    origine: "La conosci tu.",
    categoria: "certo",
  },
  annoNascita: {
    termine: "Anno di nascita",
    definizione: "Calcolato dall'età, puoi correggerlo se il compleanno non è ancora arrivato.",
    origine: "Documento d'identità.",
    categoria: "certo",
  },
  categoria: {
    termine: "Categoria lavorativa",
    definizione: "Il tipo di lavoro determina la gestione previdenziale e quindi l'aliquota con cui si accumulano i contributi.",
    origine: "Contratto di lavoro o estratto conto contributivo.",
    categoria: "certo",
  },
  etaPensionamento: {
    termine: "Età di pensionamento",
    definizione: "L'età a cui vorresti smettere di lavorare. Andare in pensione davvero a quell'età dipende da requisiti di legge che il simulatore non verifica.",
    origine: "Scelta tua; l'età di riferimento configurata è indicata come regola.",
    categoria: "ipotesi",
  },
  redditoDesiderato: {
    termine: "Reddito mensile desiderato",
    definizione: "Quanto vorresti avere ogni mese in pensione, in euro di oggi e al lordo delle tasse, per confrontarlo con le stime.",
    origine: "Scelta tua.",
    categoria: "ipotesi",
  },
  invalidita: {
    termine: "Pensione di invalidità",
    definizione:
      "Prestazione per chi ha una riduzione della capacità di lavoro riconosciuta. Ha regole proprie: il simulatore non la calcola, la somma al reddito così come la indichi.",
    origine: "Comunicazione o cedolino dell'ente previdenziale.",
    categoria: "certo",
  },
  stipendioLordo: {
    termine: "Stipendio lordo (retribuzione imponibile)",
    definizione: "Lo stipendio prima di tasse e contributi a tuo carico. È la base su cui si calcolano i contributi previdenziali.",
    origine: "Busta paga, Certificazione Unica o estratto conto contributivo.",
    categoria: "certo",
  },
  mensilita: {
    termine: "Mensilità",
    definizione: "Quante buste paga ricevi in un anno (es. 13 con la tredicesima, 14 con la quattordicesima).",
    origine: "Contratto di lavoro.",
    categoria: "certo",
  },
  anniLavorati: {
    termine: "Anni già lavorati",
    definizione: "Quanti anni hai lavorato finora, anche in modo discontinuo.",
    origine: "La tua storia lavorativa.",
    categoria: "certo",
  },
  anniFuturi: {
    termine: "Anni futuri di lavoro",
    definizione: "Quanti anni pensi di lavorare ancora da oggi. Se sono meno di quelli che mancano alla pensione, gli anni restanti non avranno contributi.",
    origine: "Stima tua.",
    categoria: "ipotesi",
  },
  crescitaStipendio: {
    termine: "Crescita annua dello stipendio",
    definizione: "Di quanto pensi che aumenti il tuo stipendio lordo ogni anno, in media. Questo valore può cambiare.",
    origine: "Ipotesi: nessuno conosce la carriera futura.",
    categoria: "ipotesi",
  },
  anniSenzaContributi: {
    termine: "Anni senza contributi",
    definizione: "Periodi futuri in cui prevedi di non versare contributi (studio, pausa, disoccupazione, estero).",
    origine: "Ipotesi tua.",
    categoria: "ipotesi",
  },
  anniContributi: {
    termine: "Anni di contributi",
    definizione: "Il periodo per cui risultano versati contributi a tuo nome.",
    origine: "Estratto conto contributivo INPS.",
    categoria: "certo",
  },
  aliquota: {
    termine: "Aliquota contributiva di computo",
    definizione: "La percentuale dello stipendio lordo che va ad alimentare il tuo montante pensionistico.",
    origine: "Regola della tua gestione previdenziale (valore configurato nel sistema).",
    categoria: "regola",
  },
  montante: {
    termine: "Montante contributivo",
    definizione: "La somma dei contributi versati a tuo nome, rivalutata nel tempo. È il 'salvadanaio' da cui si calcola la pensione contributiva.",
    origine: "Estratto conto contributivo INPS. Se non lo conosci viene stimato.",
    categoria: "certo",
  },
  contributiAccreditati: {
    termine: "Contributi accreditati",
    definizione: "Il totale dei contributi registrati a tuo nome. Se non indichi il montante, viene usato come base di partenza (senza rivalutazione passata).",
    origine: "Estratto conto contributivo.",
    categoria: "certo",
  },
  mesiMancanti: {
    termine: "Periodi mancanti",
    definizione: "Mesi in cui risultano buchi contributivi già passati.",
    origine: "Estratto conto contributivo.",
    categoria: "certo",
  },
  altreGestioni: {
    termine: "Altre gestioni previdenziali",
    definizione: "Contributi versati in casse o gestioni diverse (es. casse professionali). Il simulatore non li unisce automaticamente.",
    origine: "Estratti conto delle diverse gestioni.",
    categoria: "certo",
  },
  coefficiente: {
    termine: "Coefficiente di trasformazione",
    definizione: "La percentuale che trasforma il montante in pensione annua. Cresce con l'età di pensionamento ed è aggiornata periodicamente per legge.",
    origine: "Regola normativa (valore configurato o inserito da te).",
    categoria: "regola",
  },
  rivalutazione: {
    termine: "Rivalutazione del montante",
    definizione: "Ogni anno il montante viene aumentato di un tasso legato all'andamento dell'economia. Questo valore può cambiare.",
    origine: "Variabile incerta: il tasso futuro non è noto.",
    categoria: "incerto",
  },
  etf: {
    termine: "ETF",
    definizione: "Un fondo quotato in borsa che replica un indice. È uno strumento di investimento: il valore sale e scende e il capitale non è garantito.",
    origine: "Definizione generale, nessun prodotto specifico.",
    categoria: "incerto",
  },
  capitaleIniziale: {
    termine: "Capitale già investito",
    definizione: "Il valore attuale degli investimenti che già possiedi e vuoi includere.",
    origine: "Il tuo estratto conto titoli.",
    categoria: "certo",
  },
  versamentiEffettuati: {
    termine: "Versamenti già effettuati",
    definizione: "Quanto hai versato in totale finora. Serve solo come riferimento, non entra nel calcolo futuro.",
    origine: "Il tuo estratto conto titoli.",
    categoria: "certo",
  },
  versamentoMensile: {
    termine: "Versamento mensile",
    definizione: "Quanto pensi di investire ogni mese.",
    origine: "Scelta tua.",
    categoria: "ipotesi",
  },
  rendimento: {
    termine: "Rendimento annuo ipotizzato",
    definizione: "La crescita media annua lorda che ipotizzi per l'investimento. Non è una previsione: può essere più alto, più basso o negativo.",
    origine: "Ipotesi: nessuno conosce i rendimenti futuri.",
    categoria: "incerto",
  },
  costoAnnuo: {
    termine: "Costo annuo (TER)",
    definizione: "La percentuale che lo strumento trattiene ogni anno per la gestione. Nel simulatore viene sottratta ogni mese in proporzione.",
    origine: "Documento informativo dello strumento.",
    categoria: "ipotesi",
  },
  commissione: {
    termine: "Commissione per versamento",
    definizione: "Il costo fisso che paghi alla piattaforma a ogni acquisto.",
    origine: "Condizioni della tua piattaforma.",
    categoria: "ipotesi",
  },
  inflazione: {
    termine: "Inflazione",
    definizione: "L'aumento generale dei prezzi. Con il 2% annuo, 100 € tra 35 anni comprano quanto circa 50 € di oggi. Questo valore può cambiare.",
    origine: "Variabile incerta.",
    categoria: "incerto",
  },
  incrementoVersamento: {
    termine: "Incremento annuo del versamento",
    definizione: "Di quanto aumenti il versamento mensile ogni anno (es. per seguire lo stipendio).",
    origine: "Scelta tua.",
    categoria: "ipotesi",
  },
  etaUtilizzo: {
    termine: "Età di utilizzo del capitale",
    definizione: "L'età in cui inizieresti a prelevare dal capitale accumulato.",
    origine: "Scelta tua.",
    categoria: "ipotesi",
  },
  valoreReale: {
    termine: "Valore reale",
    definizione: "Un importo futuro espresso in euro di oggi, cioè ridotto dell'inflazione ipotizzata. Ti dice quanto potere d'acquisto avrebbe.",
    origine: "Calcolo: valore nominale ÷ (1 + inflazione)^anni.",
    categoria: "ipotesi",
  },
  valoreNominale: {
    termine: "Valore nominale",
    definizione: "L'importo in euro dell'anno futuro, senza correggere per l'aumento dei prezzi.",
    origine: "Calcolo del simulatore.",
    categoria: "ipotesi",
  },
  gap: {
    termine: "Gap previdenziale",
    definizione: "La differenza tra il reddito che desideri e quello stimato (pensione + eventuale integrazione ETF).",
    origine: "Calcolo del simulatore.",
    categoria: "ipotesi",
  },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof glossary;

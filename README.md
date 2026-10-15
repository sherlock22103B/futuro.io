# FUTURO.IO

> **Calcola oggi il reddito del tuo domani.**

Web app educativa italiana che permette di:

1. inserire età, stipendio, contributi e altri dati previdenziali;
2. stimare la pensione pubblica con logica **contributiva**, anno per anno;
3. simulare un **piano di accumulo ETF**, mese per mese, in tre scenari didattici;
4. confrontare pensione, capitale ETF e reddito desiderato (**gap previdenziale**);
5. vedere tutto in grafici interattivi e accessibili;
6. modificare le ipotesi con slider e vedere subito come cambia il risultato;
7. distinguere sempre **dati certi**, **regole attuali**, **ipotesi** e **variabili incerte**.

> FUTURO.IO produce stime educative sulla base dei dati inseriti, dei parametri configurati e delle regole attualmente considerate. Non garantisce l’importo effettivo della pensione o il rendimento degli investimenti. Non costituisce consulenza previdenziale, fiscale o finanziaria.

---

## Installazione

Requisiti: **Node.js 18.18+** (consigliato 20 o 22 LTS).

```bash
npm install
npm run dev
```

Apri http://localhost:3000.

Altri comandi:

| Comando | Cosa fa |
|---|---|
| `npm run build` | esporta il sito statico nella cartella `out/` |
| `npm test` | esegue i test automatici (Vitest) |
| `npm run typecheck` | controllo TypeScript senza emissione |

## Pubblicazione su GitHub Pages

Il sito è completamente statico (`output: "export"`), quindi si pubblica gratis su GitHub Pages.

1. Crea un repository su GitHub (es. `futuro-io`) e carica il progetto sul branch `main`.
2. Nel repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Il workflow `.github/workflows/deploy.yml` esegue typecheck, test e build e pubblica il sito su
   `https://<utente>.github.io/<repository>/`.

Ogni `git push` su `main` ripubblica il sito in 1–2 minuti. Se typecheck o test falliscono, la versione online resta quella precedente.
Il sottopercorso (`/<repository>`) è calcolato automaticamente dal workflow tramite `NEXT_PUBLIC_BASE_PATH`.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · componenti in stile shadcn/ui (Radix UI) · React Hook Form · Zod · Recharts · Lucide Icons · localStorage · PWA (manifest + service worker).

Nessun database, nessuna autenticazione, nessun tracker. I dati restano nel browser.

## Architettura

```
src/
  app/                         Pagine (App Router)
    page.tsx                   Home
    simulatore/                Percorso guidato (passaggi 1–4: Chi sei, Carriera, Contributi, Piano ETF)
    risultati/                 Passaggio 5: Il tuo futuro
    confronta/                 Scenari salvati e tabella comparativa
    report/                    "Il mio futuro secondo i dati di oggi" (stampabile)
    come-funziona/             Spiegazione e glossario
    metodologia/               Fonti, formule, parametri, limiti
    privacy/                   Privacy e disclaimer
    manifest.ts                Manifest PWA
  components/
    ui/                        Primitive in stile shadcn/ui (Button, Card, Slider, Tabs, Dialog…)
    forms/                     Stepper, NumberInput (CurrencyInput, PercentageInput), PersonalForm,
                               CareerForm, PensionForm, ETFForm, SimulatorWizard
    charts/                    CombinedFutureChart, PensionProjectionChart, ETFProjectionChart,
                               RetirementIncomeChart, ChartDataTable, esportazione PNG
    results/                   ResultCards/GapCard, WhatIfPanel, AssumptionCard,
                               DataCompletenessIndicator, ScenarioComparison,
                               PrintableFutureReport, DataActions, SaveScenarioDialog
    common/                    DataCategoryBadge, SourceTooltip, Empty/Error/LoadingState, ConfirmDialog
    layout/                    Header, navigazione mobile inferiore, footer, legenda, DisclaimerBanner
    providers/                 SimulationProvider (stato + persistenza localStorage)
  config/
    pensionParameters.ts       ★ Parametri normativi centralizzati (aliquote, coefficienti, età, mensilità…)
    simulationDefaults.ts      Ipotesi predefinite, limiti, spread degli scenari, dati demo
    officialSources.ts         Fonti istituzionali
  lib/
    pension/                   calculatePension (motore puro, anno per anno)
    etf/                       calculateETF, calculateETFScenarios (motore puro, mese per mese)
    retirement/                calculateRetirementIncome (prelievo del capitale)
    inflation/                 calculateRealValue
    scenarios/                 runSimulation, applyWhatIf, compareScenarios, completezza
    validation/                Schemi Zod e avvisi su valori insoliti
    storage/                   localStorage, esportazione/importazione JSON
tests/                         Test Vitest dei motori, della validazione e dello storage
public/                        Icone e service worker
```

I **motori di calcolo** sono funzioni pure, tipizzate e separate dall'interfaccia. Ognuna restituisce `{ risultato, dettaglio, ipotesi, avvisi, errori }`.

## Metodologia

### Pensione pubblica (contributiva, anno per anno)

```
contributi anno            = retribuzione imponibile × aliquota contributiva
montante anno successivo   = montante × (1 + rivalutazione) + contributi anno
pensione annua lorda       = montante finale × coefficiente di trasformazione(età)
pensione mensile lorda     = pensione annua lorda ÷ mensilità
```

- Per ogni anno si memorizzano età, anno solare, stipendio, contributi, montante iniziale, rivalutazione, montante finale.
- Anni senza contribuzione: stipendio e contributi a zero; rivalutazione configurabile; evidenziati nel grafico.
- Montante non noto: stimato ricostruendo gli anni passati (segnalato come stima).

### Piano ETF (mese per mese)

1. versamento → 2. commissione → 3. rendimento mensile `(1 + r)^(1/12) − 1` → 4. costo annuo ÷ 12 sul capitale → 5. aggiornamento.

Crescita lorda, commissioni e costi di gestione sono tracciati separatamente. Nessuna tassazione: *risultato prima dell'eventuale tassazione finale*. Scenari prudente/favorevole = rendimento centrale ∓ spread configurabile (default 2 punti).

### Valori automatici (non modificabili dall'utente)

| Valore | Come è ottenuto | Stato |
|---|---|---|
| Aliquota contributiva | dalla categoria lavorativa (`pensionParameters.ts`) | demo |
| Montante già maturato | stimato da anni di contributi e stipendio | stima |
| Coefficiente, rivalutazione | dall'età di pensionamento / configurazione | demo |
| Inflazione | 2%, obiettivo di medio periodo della BCE | riferimento ufficiale |
| Rendimento ETF | 4% scenario centrale (±2 punti per prudente/favorevole) | demo didattico |
| Costo annuo ETF (TER) | 0,20%, tipico di un ETF globale a replica di indice | demo |
| Commissione per rata | dalla piattaforma scelta (`investmentPlatforms.ts`), fonte justETF, dati al 12/10/2026; banche tradizionali e "non so" = stima 3,50 € | fonte pubblica / stima |
| Rendimento durante il prelievo | 0% oltre l'inflazione | demo |

Il piano ETF è **facoltativo**. Chi studia indica l'età di inizio lavoro e lo stipendio iniziale previsto. La pensione di invalidità, se indicata, è sommata al reddito così com'è (non calcolata).

### Reddito e gap

- Prelievo per N anni: `P = C·i / (1 − (1+i)^−n)`; con `i = 0`: `C / n`.
- Prelievo percentuale: `C × % ÷ 12`.
- Confronto in **media mensile su 12 mesi** e in **euro di oggi**: `gap = max(0, desiderato − pensione annua/12 − prelievo ETF)`.
- Valore reale: `nominale ÷ (1 + inflazione)^anni`.

### Completezza della simulazione

Indicatore basato solo sui campi compilati (dati documentati inseriti, parametri configurati/verificati, ipotesi lasciate al default). **Non** è una probabilità di realizzazione.

## Parametri normativi — IMPORTANTE

Tutti i valori in `src/config/pensionParameters.ts` sono marcati **`stato: "demo"`** e mostrati nell'interfaccia come:

> VALORE DEMO — DA SOSTITUIRE CON PARAMETRO UFFICIALE

Non sono stati verificati su una fonte ufficiale. Per aggiornarli:

1. verifica il valore su INPS / Ministero del Lavoro / Gazzetta Ufficiale;
2. sostituisci `valore`, imposta `stato: "verificato"`, compila `fonte` e `verificatoIl`;
3. aggiorna `dataAggiornamento`.

Il motore non contiene valori codificati: non serve toccare altro.

Anche le ipotesi predefinite (`src/config/simulationDefaults.ts`: crescita stipendio, inflazione, rendimento, costi, spread scenari) sono valori didattici, non medie storiche né previsioni.

## Dati dimostrativi

Il pulsante **«Prova con dati dimostrativi»** carica un profilo **inventato**, etichettato come tale ovunque. Non rappresenta una persona reale, una media italiana o un dato ufficiale.

## Privacy

- Dati salvati solo nel `localStorage` del browser (`futuro-io:*`).
- Nessun invio di dati finanziari a server; nessun nome, codice fiscale, SPID o documento richiesto.
- Nessun tracker pubblicitario, nessun dark pattern; cancellazione completa con un clic.
- Esportazione/importazione JSON gestita interamente nel browser.

## Accessibilità

Label associate a ogni campo, errori annunciati (`role="alert"`) con riepilogo e focus sul primo campo errato, navigazione da tastiera, focus visibile, popover informativi apribili da tastiera e touch, grafici con descrizione testuale e tabella dati, colori delle serie validati per contrasto e daltonismo, aree di tocco ≥ 44px, modalità «Riduci animazioni» (e rispetto di `prefers-reduced-motion`).

## Limitazioni e casi non gestiti

Sistema retributivo/misto, ricongiunzioni, riscatti, totalizzazione e cumulo, casse professionali, pensioni anticipate e requisiti di accesso, integrazioni al minimo, previdenza complementare e TFR, massimali/minimali, tassazione, volatilità e sequenza dei rendimenti.

## Test

`npm test` copre: versamento zero, rendimento zero, costi superiori al rendimento, capitale iniziale senza versamenti (confronto con `C·(1+r)^n`), formula chiusa della rendita anticipata, anni senza contributi, montante iniziale zero, cambio età pensionabile, conversione nominale→reale, aggiornamento scenari e what-if, salvataggio/importazione JSON, validazione.

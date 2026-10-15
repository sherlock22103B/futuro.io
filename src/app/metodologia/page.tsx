import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pensionParameters, DEMO_LABEL, type ConfiguredValue } from "@/config/pensionParameters";
import { officialSources } from "@/config/officialSources";
import { AUTO_VALUES, SCENARIO_SPREAD } from "@/config/simulationDefaults";
import { investmentPlatforms, PLATFORM_SOURCE } from "@/config/investmentPlatforms";
import { WORK_CATEGORY_LABELS, WORK_CATEGORY_VALUES } from "@/lib/types";
import { formatDate, formatEuro, formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Fonti e metodologia",
  description: "Formule, parametri, fonti ufficiali, limiti e casi non gestiti dal simulatore FUTURO.IO.",
};

function StatusBadge({ v }: { v: ConfiguredValue<unknown> }) {
  return v.stato === "demo" ? <Badge variant="demo">Valore demo</Badge> : <Badge>Verificato{v.verificatoIl ? ` il ${formatDate(v.verificatoIl)}` : ""}</Badge>;
}

function Formula({ children }: { children: React.ReactNode }) {
  return <code className="block overflow-x-auto rounded-lg border border-border bg-background/70 px-3 py-2 font-mono text-sm text-slate-100">{children}</code>;
}

export default function MetodologiaPage() {
  const p = pensionParameters;
  return (
    <div className="container max-w-5xl space-y-10 pb-8">
      <PageHeader
        eyebrow="Fonti e metodologia"
        title="Come calcoliamo, con quali parametri, entro quali limiti"
        description={<>Trasparenza completa: ogni formula, ogni parametro e la sua origine. Ultimo aggiornamento dei parametri: <strong>{formatDate(p.dataAggiornamento)}</strong>.</>}
      />

      <div role="note" className="rounded-xl border border-amber-300/50 bg-amber-300/10 p-4 text-sm">
        <p className="font-semibold text-amber-100">{DEMO_LABEL}</p>
        <p className="mt-1 text-amber-50/90">
          In questa versione tutti i parametri normativi sono dimostrativi: non sono stati verificati su una fonte ufficiale e non vanno usati come tali.
          Si aggiornano in un unico file (<code>src/config/pensionParameters.ts</code>) senza modificare il motore di calcolo.
        </p>
      </div>

      <section aria-labelledby="formule-pensione" className="space-y-4">
        <h2 id="formule-pensione" className="text-2xl font-bold">1. Pensione pubblica (logica contributiva)</h2>
        <p className="text-muted-foreground">Il calcolo è eseguito anno per anno, dall&apos;età attuale all&apos;età di pensionamento scelta.</p>
        <Formula>contributi dell&apos;anno = retribuzione imponibile annua × aliquota contributiva</Formula>
        <Formula>montante anno successivo = montante × (1 + tasso di rivalutazione) + contributi dell&apos;anno</Formula>
        <Formula>pensione annua lorda = montante finale × coefficiente di trasformazione (età di pensionamento)</Formula>
        <Formula>pensione mensile lorda = pensione annua lorda ÷ numero di mensilità</Formula>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Lo stipendio cresce ogni anno della percentuale ipotizzata: stipendio(k) = stipendio attuale × (1 + crescita)^k.</li>
          <li>Aliquota contributiva, coefficiente e tasso di rivalutazione sono automatici: derivano dalla categoria lavorativa, dall&apos;età di pensionamento e dalla configurazione.</li>
          <li>Il montante già maturato viene sempre stimato automaticamente, ricostruendo gli anni di contributi passati con lo stipendio attuale scontato della crescita ipotizzata.</li>
          <li>Per chi studia: nessun contributo fino all&apos;età di inizio lavoro indicata; da lì lo stipendio iniziale previsto cresce ogni anno.</li>
          <li>Pensione di invalidità: non viene calcolata. Se la indichi, è sommata al reddito futuro come importo costante in euro di oggi.</li>
          <li>Se l&apos;età scelta è fuori dalla tabella dei coefficienti, si usa il coefficiente più vicino e viene mostrato un avviso.</li>
        </ul>
      </section>

      <section aria-labelledby="formule-etf" className="space-y-4">
        <h2 id="formule-etf" className="text-2xl font-bold">2. Piano di accumulo ETF</h2>
        <p className="text-muted-foreground">Calcolo mese per mese. Per ogni mese: versamento → commissione → rendimento → costo annuo in proporzione.</p>
        <Formula>rendimento mensile = (1 + r)^(1/12) − 1</Formula>
        <Formula>capitale = (capitale + versamento − commissione) × (1 + rendimento mensile) − capitale × costo annuo ÷ 12</Formula>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Crescita lorda, commissioni e costi di gestione sono calcolati e mostrati separatamente: il costo non viene semplicemente sottratto dal rendimento.</li>
          <li>Il versamento può aumentare ogni anno di una percentuale scelta.</li>
          <li>I versamenti si fermano dopo gli anni indicati; il capitale continua a evolvere fino all&apos;età di utilizzo.</li>
          <li>Nessuna tassazione applicata: risultato prima dell&apos;eventuale tassazione finale.</li>
          <li>Il piano ETF è facoltativo: se non lo attivi, il risultato considera solo la pensione pubblica.</li>
        </ul>
        <Card>
          <CardHeader>
            <CardTitle>Valori automatici del piano (non modificabili)</CardTitle>
            <CardDescription>Calcolati o stimati dal simulatore. Configurabili in <code>src/config/simulationDefaults.ts</code> e <code>src/config/investmentPlatforms.ts</code>.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Rendimento annuo lordo:</strong> {formatPercent(AUTO_VALUES.rendimentoETF.valore)} nello scenario centrale. {AUTO_VALUES.rendimentoETF.descrizione}</p>
            <p><strong>Scenari:</strong> prudente {formatPercent(AUTO_VALUES.rendimentoETF.valore + SCENARIO_SPREAD.prudente)}, favorevole {formatPercent(AUTO_VALUES.rendimentoETF.valore + SCENARIO_SPREAD.favorevole)}. Ipotesi didattiche, non previsioni.</p>
            <p><strong>Costo annuo dello strumento:</strong> {formatPercent(AUTO_VALUES.costoAnnuoETF.valore)}. {AUTO_VALUES.costoAnnuoETF.descrizione}</p>
            <p><strong>Inflazione:</strong> {formatPercent(AUTO_VALUES.inflazione.valore)}. {AUTO_VALUES.inflazione.descrizione}</p>
            <p><strong>Rendimento durante il prelievo:</strong> {formatPercent(AUTO_VALUES.rendimentoPrelievo.valore)} oltre l&apos;inflazione. {AUTO_VALUES.rendimentoPrelievo.descrizione}</p>
          </CardContent>
        </Card>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <caption className="px-3 py-2 text-left">
              <span className="font-semibold">Commissione per versamento in base alla piattaforma</span>
              <span className="block text-xs text-muted-foreground">
                Fonte: <a className="underline" href={PLATFORM_SOURCE.url} target="_blank" rel="noopener noreferrer">{PLATFORM_SOURCE.nome}</a>, dati
                aggiornati al {formatDate(PLATFORM_SOURCE.datiAggiornatiAl)}, consultati il {formatDate(PLATFORM_SOURCE.consultatoIl)}. Le tariffe cambiano: verifica sempre sul sito dell&apos;intermediario. L&apos;elenco non è un consiglio né una classifica.
              </span>
            </caption>
            <thead className="bg-card">
              <tr>
                <th scope="col" className="px-3 py-2 text-left">Piattaforma</th>
                <th scope="col" className="px-3 py-2 text-right">Commissione per rata</th>
                <th scope="col" className="px-3 py-2 text-left">Origine</th>
              </tr>
            </thead>
            <tbody>
              {investmentPlatforms.map((pl) => (
                <tr key={pl.id} className="border-t border-border">
                  <th scope="row" className="px-3 py-2 text-left font-medium">
                    {pl.nome}
                    {pl.nota && <span className="block text-xs font-normal text-muted-foreground">{pl.nota}</span>}
                  </th>
                  <td className="px-3 py-2 text-right tabular">{formatEuro(pl.commissionePAC, true)}</td>
                  <td className="px-3 py-2">{pl.affidabilita === "stima" ? <Badge variant="demo">Stima</Badge> : <Badge>Fonte pubblica</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="reddito" className="space-y-4">
        <h2 id="reddito" className="text-2xl font-bold">3. Reddito futuro, prelievo e gap</h2>
        <Formula>prelievo per N anni = C × i ÷ (1 − (1 + i)^(−12N)) · con i = 0: C ÷ (12N)</Formula>
        <Formula>prelievo percentuale annuo = C × percentuale ÷ 12 (al mese)</Formula>
        <Formula>gap mensile = max(0, reddito desiderato − pensione annua ÷ 12 − pensione di invalidità − prelievo ETF mensile)</Formula>
        <p className="text-sm text-muted-foreground">
          Il confronto avviene in euro di oggi e in media mensile su 12 mesi, per rendere confrontabili pensione (pagata su più mensilità), prelievi mensili
          e reddito desiderato. L&apos;integrazione ETF è una simulazione di prelievo e non una rendita garantita.
        </p>
      </section>

      <section aria-labelledby="reale" className="space-y-4">
        <h2 id="reale" className="text-2xl font-bold">4. Valori nominali e valori reali</h2>
        <Formula>valore reale = valore nominale ÷ (1 + inflazione)^anni</Formula>
        <p className="text-sm text-muted-foreground">
          Il <strong>valore nominale</strong> è l&apos;importo in euro dell&apos;anno futuro. Il <strong>valore reale</strong> lo riporta in euro di oggi, togliendo
          l&apos;effetto dell&apos;aumento dei prezzi ipotizzato. Con un&apos;inflazione del 2% annuo, 1.000 € tra 35 anni hanno un potere d&apos;acquisto di circa 500 € di oggi.
        </p>
      </section>

      <section aria-labelledby="parametri" className="space-y-4">
        <h2 id="parametri" className="text-2xl font-bold">5. Parametri configurati e loro origine</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Parametri normativi configurati</caption>
            <thead className="bg-card">
              <tr>
                <th scope="col" className="px-3 py-2 text-left">Parametro</th>
                <th scope="col" className="px-3 py-2 text-left">Valore</th>
                <th scope="col" className="px-3 py-2 text-left">Stato</th>
                <th scope="col" className="px-3 py-2 text-left">Fonte di riferimento</th>
              </tr>
            </thead>
            <tbody>
              {WORK_CATEGORY_VALUES.map((c) => (
                <tr key={c} className="border-t border-border">
                  <th scope="row" className="px-3 py-2 text-left font-medium">Aliquota — {WORK_CATEGORY_LABELS[c]}</th>
                  <td className="px-3 py-2 tabular">{formatPercent(p.aliquotePerCategoria[c].valore)}</td>
                  <td className="px-3 py-2"><StatusBadge v={p.aliquotePerCategoria[c]} /></td>
                  <td className="px-3 py-2">{p.aliquotePerCategoria[c].fonte?.nome}</td>
                </tr>
              ))}
              {[
                ["Età pensionabile di riferimento", `${p.etaPensionabile.valore} anni`, p.etaPensionabile],
                ["Mensilità della pensione", String(p.mensilitaPensione.valore), p.mensilitaPensione],
                ["Rivalutazione annua predefinita", formatPercent(p.rivalutazioneDefault.valore), p.rivalutazioneDefault],
                ["Rivalutazione negli anni senza contributi", p.rivalutaAnniSenzaContributi.valore ? "Attiva" : "Non attiva", p.rivalutaAnniSenzaContributi],
                ["Trattamento fiscale", "Non applicato", p.trattamentoFiscale],
              ].map(([label, value, v]) => (
                <tr key={label as string} className="border-t border-border">
                  <th scope="row" className="px-3 py-2 text-left font-medium">{label as string}</th>
                  <td className="px-3 py-2 tabular">{value as string}</td>
                  <td className="px-3 py-2"><StatusBadge v={v as ConfiguredValue<unknown>} /></td>
                  <td className="px-3 py-2">{(v as ConfiguredValue<unknown>).fonte?.nome ?? "Configurazione del simulatore"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[480px] text-sm">
            <caption className="px-3 py-2 text-left font-semibold">
              Coefficienti di trasformazione configurati <StatusBadge v={p.coefficientiTrasformazione} />
            </caption>
            <thead className="bg-card">
              <tr>
                <th scope="col" className="px-3 py-2 text-left">Età</th>
                {Object.keys(p.coefficientiTrasformazione.valore).map((a) => (
                  <th key={a} scope="col" className="px-2 py-2 text-right">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <th scope="row" className="px-3 py-2 text-left font-medium">Coefficiente</th>
                {Object.values(p.coefficientiTrasformazione.valore).map((v, i) => (
                  <td key={i} className="px-2 py-2 text-right tabular">{formatPercent(v, 3)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {p.noteMetodologiche.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </section>

      <section aria-labelledby="limiti" className="space-y-4">
        <h2 id="limiti" className="text-2xl font-bold">6. Limitazioni e casi non gestiti</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Limitazioni del simulatore</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Stima solo la componente contributiva della pensione.</li>
                <li>Parametri normativi dimostrativi, non aggiornati automaticamente.</li>
                <li>Rendimenti, inflazione e rivalutazione costanti per tutto il periodo.</li>
                <li>Nessuna tassazione su pensione, capitale o prelievi.</li>
                <li>Non verifica i requisiti di accesso alla pensione.</li>
                <li>Non considera la volatilità degli investimenti né l&apos;ordine dei rendimenti.</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Casi non gestiti</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Sistema retributivo o misto.</li>
                <li>Ricongiunzioni, riscatti (laurea, periodi scoperti), totalizzazione, cumulo.</li>
                <li>Casse professionali e gestioni diverse da quelle elencate.</li>
                <li>Pensioni anticipate, invalidità, superstiti, integrazioni al minimo.</li>
                <li>Previdenza complementare (fondi pensione) e TFR.</li>
                <li>Massimali contributivi, minimali e agevolazioni.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="fonti" aria-labelledby="fonti-title" className="scroll-mt-24 space-y-4">
        <h2 id="fonti-title" className="text-2xl font-bold">7. Fonti ufficiali</h2>
        <p className="text-sm text-muted-foreground">Per dati personali e parametri aggiornati, consulta sempre le fonti istituzionali. Descrizioni originali e sintetiche.</p>
        <ul className="grid gap-4 md:grid-cols-2">
          {officialSources.map((s) => (
            <li key={s.id}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary hover:underline">
                      {s.nome} <ExternalLink className="h-4 w-4" aria-hidden />
                      <span className="sr-only">(si apre in una nuova scheda)</span>
                    </a>
                  </CardTitle>
                  <CardDescription>{s.ambito}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{s.descrizione}</CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <DisclaimerBanner />
    </div>
  );
}

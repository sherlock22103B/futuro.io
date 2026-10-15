import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataLegend } from "@/components/layout/DataLegend";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { glossary } from "@/lib/glossary";
import { DataCategoryBadge } from "@/components/common/DataCategoryBadge";

export const metadata: Metadata = {
  title: "Come funziona",
  description: "Il percorso del simulatore, le quattro categorie di dati e un glossario dei termini.",
};

const STEPS = [
  { t: "Chi sei", d: "Età, categoria (anche studente), età a cui vorresti andare in pensione, reddito che desideri ed eventuale pensione di invalidità. Nessun dato identificativo." },
  { t: "La tua carriera", d: "Stipendio lordo (annuo o mensile), anni già lavorati e futuri, crescita ipotizzata. Se studi: a che età pensi di iniziare a lavorare." },
  { t: "I tuoi contributi", d: "Solo da quanti anni versi contributi. Aliquota, montante già maturato, coefficiente e rivalutazione li calcoliamo noi." },
  { t: "Il tuo piano ETF (facoltativo)", d: "Se vuoi: dove investiresti, quanto versi e per quanto. Commissioni, costi, rendimento e inflazione sono automatici." },
  { t: "Il tuo futuro", d: "Card, grafici interattivi, gap rispetto al reddito desiderato, slider per cambiare le ipotesi e scenari da confrontare." },
];

export default function ComeFunzionaPage() {
  return (
    <div className="container max-w-5xl space-y-10 pb-8">
      <PageHeader
        eyebrow="Come funziona"
        title="Dal presente al futuro, un passaggio alla volta"
        description="FUTURO.IO mette in fila i tuoi dati, le regole configurate e le tue ipotesi, e ti mostra come ognuno di questi elementi influisce sul risultato."
      />

      <section aria-labelledby="percorso" className="space-y-4">
        <h2 id="percorso" className="text-2xl font-bold">Il percorso guidato</h2>
        <ol className="grid gap-4 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.t} className="flex gap-4 rounded-2xl border border-border bg-card/60 p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="categorie" className="space-y-4">
        <h2 id="categorie" className="text-2xl font-bold">Quattro colori, quattro tipi di informazione</h2>
        <p className="text-muted-foreground">Ogni campo e ogni ipotesi è etichettato. Così sai sempre cosa è un fatto e cosa è una scelta sul futuro.</p>
        <DataLegend />
      </section>

      <section aria-labelledby="calcolo" className="grid gap-4 md:grid-cols-2">
        <h2 id="calcolo" className="sr-only">Come si calcola</h2>
        <Card>
          <CardHeader><CardTitle>La pensione pubblica</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Ogni anno una parte dello stipendio lordo (l&apos;aliquota) va nel tuo montante. Il montante viene rivalutato e, alla pensione, trasformato in un importo annuo con il coefficiente legato all&apos;età.</p>
            <p>Il calcolo è fatto anno per anno: puoi vedere ogni riga nella tabella dei risultati.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Il piano ETF</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Ogni mese aggiungiamo il versamento, togliamo l&apos;eventuale commissione, applichiamo il rendimento mensile equivalente e sottraiamo il costo annuo in proporzione.</p>
            <p>Tre scenari (prudente, centrale, favorevole) mostrano quanto il risultato dipenda dal rendimento, che nessuno conosce in anticipo.</p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="glossario" className="space-y-4">
        <h2 id="glossario" className="text-2xl font-bold">Glossario</h2>
        <dl className="grid gap-3 md:grid-cols-2">
          {Object.values(glossary).map((g) => (
            <div key={g.termine} className="rounded-xl border border-border bg-card/50 p-4">
              <dt className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                {g.termine} <DataCategoryBadge category={g.categoria} compact />
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground">{g.definizione}</dd>
              <dd className="mt-1 text-xs"><span className="font-medium">Origine:</span> <span className="text-muted-foreground">{g.origine}</span></dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg"><Link href="/simulatore">Calcola il mio futuro</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/metodologia">Fonti e metodologia</Link></Button>
      </div>
      <DisclaimerBanner />
    </div>
  );
}

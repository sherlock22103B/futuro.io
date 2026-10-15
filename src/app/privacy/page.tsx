import type { Metadata } from "next";
import { Ban, HardDrive, Lock, Trash2, UserX } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { Card, CardContent } from "@/components/ui/card";
import { ClearDataSection } from "./ClearDataSection";

export const metadata: Metadata = {
  title: "Privacy e disclaimer",
  description: "I dati restano sul tuo dispositivo. Nessun account, nessun tracker pubblicitario.",
};

const POINTS = [
  { icon: HardDrive, t: "I dati restano sul tuo dispositivo", d: "Simulazione, scenari e preferenze sono salvati solo nel localStorage del tuo browser. Nessun dato finanziario viene inviato a server esterni." },
  { icon: UserX, t: "Nessun dato identificativo", d: "Non chiediamo nome, codice fiscale, SPID, documenti o email. Non serve alcun account." },
  { icon: Ban, t: "Nessun tracker pubblicitario", d: "Il sito non usa cookie di profilazione né strumenti di tracciamento pubblicitario." },
  { icon: Lock, t: "Nessun prodotto in vendita", d: "Non consigliamo ETF specifici, non mostriamo nomi commerciali, ticker o classifiche e non riceviamo commissioni." },
  { icon: Trash2, t: "Puoi cancellare tutto", d: "In qualsiasi momento, con un clic, da questa pagina o dai risultati. Puoi anche esportare i dati in un file JSON che resta a te." },
];

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl space-y-8 pb-8">
      <PageHeader eyebrow="Privacy e disclaimer" title="I tuoi dati sono tuoi" description="FUTURO.IO funziona interamente nel tuo browser." />
      <ul className="grid gap-4 sm:grid-cols-2">
        {POINTS.map((p) => (
          <li key={p.t}>
            <Card className="h-full">
              <CardContent className="flex gap-3 pt-5 sm:pt-6">
                <p.icon className="mt-0.5 h-5 w-5 shrink-0 text-certo" aria-hidden />
                <div>
                  <h2 className="font-semibold">{p.t}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <ClearDataSection />

      <section aria-labelledby="disclaimer-title" className="space-y-3">
        <h2 id="disclaimer-title" className="text-2xl font-bold">Disclaimer</h2>
        <DisclaimerBanner />
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>I risultati sono stime educative, non previsioni e non garanzie.</li>
          <li>Il capitale investito in strumenti finanziari non è garantito e può diminuire.</li>
          <li>I parametri normativi in questa versione sono dimostrativi e vanno verificati sulle fonti ufficiali.</li>
          <li>Per decisioni personali rivolgiti a professionisti abilitati e consulta i servizi ufficiali dell&apos;ente previdenziale.</li>
        </ul>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { ResultsView } from "@/components/results/ResultsView";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Il tuo futuro",
  description: "Pensione pubblica stimata, capitale ETF ipotetico e gap rispetto al reddito desiderato.",
};

export default function RisultatiPage() {
  return (
    <div className="container pb-8">
      <PageHeader
        eyebrow="Passaggio 5"
        title="Il tuo futuro"
        description="Stime educative basate sui dati che hai inserito e sulle ipotesi che hai scelto. Cambia le ipotesi e guarda come cambia il risultato."
      />
      <ResultsView />
    </div>
  );
}

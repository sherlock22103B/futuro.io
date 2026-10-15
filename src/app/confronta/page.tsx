import type { Metadata } from "next";
import { ScenarioComparison } from "@/components/results/ScenarioComparison";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataLegend } from "@/components/layout/DataLegend";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";

export const metadata: Metadata = {
  title: "Confronta scenari",
  description: "Confronta fino a tre scenari salvati nel tuo browser.",
};

export default function ConfrontaPage() {
  return (
    <div className="container space-y-6 pb-8">
      <PageHeader
        eyebrow="Confronta scenari"
        title="Tre futuri a confronto"
        description="Salva fino a tre varianti della tua simulazione — per esempio «Scenario base», «Inizio prima», «Verso di più» — e confrontale fianco a fianco."
      />
      <DataLegend />
      <ScenarioComparison />
      <DisclaimerBanner />
    </div>
  );
}

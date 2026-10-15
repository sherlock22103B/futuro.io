import type { Metadata } from "next";
import { Suspense } from "react";
import { SimulatorWizard } from "@/components/forms/SimulatorWizard";
import { LoadingState } from "@/components/common/States";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Simulatore",
  description: "Percorso guidato in cinque passaggi: chi sei, carriera, contributi, piano ETF e risultati.",
};

export default function SimulatorePage() {
  return (
    <div className="container max-w-4xl pb-8">
      <PageHeader
        eyebrow="Simulatore"
        title="Simula il tuo futuro"
        description="Cinque passaggi. Puoi tornare indietro quando vuoi: i dati vengono salvati automaticamente sul tuo dispositivo."
      />
      <Suspense fallback={<LoadingState />}>
        <SimulatorWizard />
      </Suspense>
    </div>
  );
}

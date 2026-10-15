"use client";

import * as React from "react";
import Link from "next/link";
import { useSimulation } from "@/components/providers/SimulationProvider";
import { runSimulation } from "@/lib/scenarios/calculateScenarios";
import { PrintableFutureReport } from "@/components/results/PrintableFutureReport";
import { DataActions } from "@/components/results/DataActions";
import { EmptyState, LoadingState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ReportPage() {
  const { hydrated, validation } = useSimulation();
  const result = React.useMemo(() => (validation.ok ? runSimulation(validation.data) : null), [validation]);

  React.useEffect(() => {
    document.title = "Il mio futuro secondo i dati di oggi · FUTURO.IO";
  }, []);

  return (
    <div className="container max-w-4xl space-y-6 py-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/risultati">
            <ArrowLeft aria-hidden /> Torna ai risultati
          </Link>
        </Button>
      </div>
      {!hydrated ? (
        <LoadingState />
      ) : !result ? (
        <EmptyState
          title="Nessuna simulazione completa"
          description="Completa il simulatore per generare il riepilogo stampabile, oppure importa una simulazione salvata."
          action={
            <div className="flex flex-col items-center gap-4">
              <Button asChild>
                <Link href="/simulatore">Vai al simulatore</Link>
              </Button>
              <DataActions input={null} showPrint={false} />
            </div>
          }
        />
      ) : (
        <>
          <DataActions input={result.input} />
          <PrintableFutureReport result={result} />
        </>
      )}
    </div>
  );
}

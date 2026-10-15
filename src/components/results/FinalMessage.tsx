"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, GitCompareArrows, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useSimulation } from "@/components/providers/SimulationProvider";

export function FinalMessage() {
  const { resetDraft } = useSimulation();
  const router = useRouter();
  return (
    <section aria-labelledby="final-title" className="no-print rounded-3xl border border-border bg-gradient-to-br from-pension/10 via-card to-etf/10 p-6 text-center sm:p-10">
      <h2 id="final-title" className="mx-auto max-w-2xl text-2xl font-bold leading-snug sm:text-3xl">
        I dati di oggi non possono prevedere perfettamente il futuro. Ma possono aiutarti a prepararlo.
      </h2>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/simulatore?passo=1">
            <Pencil aria-hidden /> Modifica lo scenario
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/confronta">
            <GitCompareArrows aria-hidden /> Confronta tre futuri
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/metodologia#fonti">
            <BookOpen aria-hidden /> Consulta le fonti ufficiali
          </Link>
        </Button>
        <ConfirmDialog
          title="Cancellare la simulazione?"
          description="I dati della simulazione corrente verranno eliminati da questo dispositivo. Gli scenari salvati restano disponibili."
          confirmLabel="Cancella la simulazione"
          destructive
          onConfirm={() => {
            resetDraft();
            router.push("/simulatore");
          }}
          trigger={
            <Button variant="outline">
              <Trash2 aria-hidden /> Cancella la simulazione
            </Button>
          }
        />
      </div>
    </section>
  );
}

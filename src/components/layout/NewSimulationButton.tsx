"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useSimulation } from "@/components/providers/SimulationProvider";
import { cn } from "@/lib/utils";

/** "Nuova simulazione": svuota la simulazione corrente (gli scenari salvati restano). */
export function NewSimulationButton({ className, variant = "header" }: { className?: string; variant?: "header" | "mobile" }) {
  const { resetDraft } = useSimulation();
  const router = useRouter();
  return (
    <ConfirmDialog
      title="Vuoi iniziare una nuova simulazione?"
      description="I dati della simulazione corrente verranno cancellati da questo dispositivo. Gli scenari salvati non vengono toccati."
      confirmLabel="Sì, ricomincia"
      onConfirm={() => {
        resetDraft();
        router.push("/simulatore");
      }}
      trigger={
        variant === "mobile" ? (
          <button
            type="button"
            className={cn("flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground", className)}
          >
            <RotateCcw className="h-5 w-5" aria-hidden />
            Nuova
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-accent",
              className,
            )}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Nuova simulazione
          </button>
        )
      }
    />
  );
}

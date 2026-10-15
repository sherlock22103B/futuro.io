"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useSimulation } from "@/components/providers/SimulationProvider";

export function ClearDataSection() {
  const { clearAll } = useSimulation();
  const [done, setDone] = React.useState(false);
  return (
    <section aria-labelledby="clear-title" className="rounded-2xl border border-border bg-card/60 p-5">
      <h2 id="clear-title" className="text-lg font-semibold">Cancella i dati da questo dispositivo</h2>
      <p className="mt-1 text-sm text-muted-foreground">Elimina simulazione, scenari salvati e preferenze.</p>
      <div className="mt-3">
        <ConfirmDialog
          title="Cancellare tutti i dati?"
          description="L'operazione elimina definitivamente da questo browser la simulazione, gli scenari e le preferenze."
          confirmLabel="Cancella tutto"
          destructive
          onConfirm={() => {
            clearAll();
            setDone(true);
          }}
          trigger={
            <Button variant="destructive">
              <Trash2 aria-hidden /> Cancella tutti i dati
            </Button>
          }
        />
      </div>
      {done && (
        <p role="status" className="mt-3 text-sm text-certo">
          Fatto: nessun dato di FUTURO.IO è più salvato in questo browser.
        </p>
      )}
    </section>
  );
}

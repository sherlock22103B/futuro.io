"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileDown, FileUp, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useSimulation } from "@/components/providers/SimulationProvider";
import { buildExportPayload, parseImport, serializeExport } from "@/lib/storage/localStorage";
import type { SimulationInput } from "@/lib/validation/schemas";

/** Stampa, esportazione/importazione JSON e cancellazione dei dati. Tutto avviene nel browser. */
export function DataActions({ input, showPrint = true }: { input: SimulationInput | null; showPrint?: boolean }) {
  const { scenarios, replaceDraft, replaceScenarios, clearAll } = useSimulation();
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null);

  const exportJson = () => {
    if (!input) return;
    const text = serializeExport(buildExportPayload(input, scenarios));
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `futuro-io-simulazione-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, text: "File JSON creato. Lo trovi tra i download del tuo dispositivo." });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 1_000_000) {
      setMessage({ ok: false, text: "Il file è troppo grande per essere una simulazione FUTURO.IO." });
      return;
    }
    const text = await file.text();
    const res = parseImport(text);
    if (!res.ok) {
      setMessage({ ok: false, text: res.errore });
    } else {
      replaceDraft(res.data.simulazione);
      if (res.data.scenari.length > 0) replaceScenarios(res.data.scenari);
      setMessage({ ok: true, text: `Simulazione importata${res.data.scenari.length ? ` con ${res.data.scenari.length} scenari` : ""}.` });
      router.push("/risultati");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="no-print space-y-3">
      <div className="flex flex-wrap gap-2">
        {showPrint && (
          <Button variant="outline" onClick={() => window.print()} disabled={!input}>
            <Printer aria-hidden /> Stampa
          </Button>
        )}
        <Button variant="outline" onClick={exportJson} disabled={!input}>
          <FileDown aria-hidden /> Salva dati in formato JSON
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <FileUp aria-hidden /> Importa simulazione
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label="Scegli un file JSON di FUTURO.IO da importare"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <ConfirmDialog
          title="Cancellare tutti i dati?"
          description="Verranno eliminati da questo dispositivo la simulazione, gli scenari salvati e le preferenze. L'operazione non si può annullare."
          confirmLabel="Cancella tutto"
          destructive
          onConfirm={() => {
            clearAll();
            setMessage({ ok: true, text: "Tutti i dati sono stati cancellati da questo dispositivo." });
            router.push("/simulatore");
          }}
          trigger={
            <Button variant="outline" className="border-red-400/50 text-red-200 hover:bg-red-500/10">
              <Trash2 aria-hidden /> Cancella tutti i dati
            </Button>
          }
        />
      </div>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm text-certo" : "text-sm text-red-300"}>
          {message.text}
        </p>
      )}
    </div>
  );
}

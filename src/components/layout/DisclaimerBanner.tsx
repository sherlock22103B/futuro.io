import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export const MAIN_DISCLAIMER =
  "FUTURO.IO produce stime educative sulla base dei dati inseriti, dei parametri configurati e delle regole attualmente considerate. Non garantisce l’importo effettivo della pensione o il rendimento degli investimenti. Non costituisce consulenza previdenziale, fiscale o finanziaria.";

export function DisclaimerBanner({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <aside
      aria-label="Avvertenza importante"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-incerto/40 bg-incerto/[0.07] text-sm",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-incerto" aria-hidden />
      <p className="text-slate-200">{MAIN_DISCLAIMER}</p>
    </aside>
  );
}

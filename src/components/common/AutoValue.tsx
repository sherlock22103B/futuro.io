import { ExternalLink, Lock } from "lucide-react";
import { DataCategoryBadge } from "./DataCategoryBadge";
import { SourceTooltip } from "./SourceTooltip";
import type { GlossaryKey } from "@/lib/glossary";
import type { DataCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AutoValueProps {
  label: string;
  value: string;
  category: DataCategory;
  /** Come è stato ottenuto il valore. */
  origin: string;
  status: "verificato" | "demo" | "stima";
  term?: GlossaryKey;
  source?: { nome: string; url: string };
  className?: string;
}

const STATUS_LABEL = {
  verificato: "Da fonte pubblica",
  demo: "Valore demo",
  stima: "Stima",
} as const;

/**
 * Valore calcolato o stimato automaticamente dal simulatore.
 * È in sola lettura: non è un campo del form e non può essere modificato.
 */
export function AutoValue({ label, value, category, origin, status, term, source, className }: AutoValueProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-secondary/30 p-3", className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          {label}
        </span>
        {term && <SourceTooltip term={term} className="-my-1 h-7 w-7" />}
        <DataCategoryBadge category={category} compact className="ml-auto" />
      </div>
      <p className="mt-1 text-xl font-bold tabular">
        {value}
        <span className="sr-only"> (calcolato automaticamente, non modificabile)</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        <span
          className={cn(
            "mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
            status === "verificato" ? "bg-certo/15 text-certo" : "bg-amber-300/15 text-amber-200",
          )}
        >
          {STATUS_LABEL[status]}
        </span>
        Automatico · {origin}
        {source && (
          <>
            {" "}
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground">
              {source.nome}
              <ExternalLink className="h-3 w-3" aria-hidden />
              <span className="sr-only">(si apre in una nuova scheda)</span>
            </a>
          </>
        )}
      </p>
    </div>
  );
}

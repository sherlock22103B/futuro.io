"use client";

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DataCategoryBadge } from "./DataCategoryBadge";
import { glossary, type GlossaryEntry, type GlossaryKey } from "@/lib/glossary";
import { cn } from "@/lib/utils";

interface SourceTooltipProps {
  term?: GlossaryKey;
  entry?: GlossaryEntry;
  className?: string;
  /** Contenuto aggiuntivo (es. stato del parametro configurato). */
  extra?: React.ReactNode;
}

/**
 * Icona informativa che apre (al clic, al tocco o con Invio) definizione, origine e categoria del dato.
 * Usa un popover invece di un tooltip al passaggio del mouse per funzionare anche su touch e tastiera.
 */
export function SourceTooltip({ term, entry, className, extra }: SourceTooltipProps) {
  const e = entry ?? (term ? glossary[term] : undefined);
  if (!e) return null;
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          className,
        )}
        aria-label={`Cosa significa «${e.termine}»?`}
      >
        <Info className="h-4 w-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{e.termine}</p>
            <DataCategoryBadge category={e.categoria} compact />
          </div>
          <p className="text-muted-foreground">{e.definizione}</p>
          <p className="text-xs">
            <span className="font-semibold">Da dove arriva: </span>
            <span className="text-muted-foreground">{e.origine}</span>
          </p>
          {extra}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Termine tecnico inline con spiegazione accessibile. */
export function Term({ term, children }: { term: GlossaryKey; children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center">
      <span className="underline decoration-dotted underline-offset-4">{children ?? glossary[term].termine}</span>
      <SourceTooltip term={term} className="h-7 w-7" />
    </span>
  );
}

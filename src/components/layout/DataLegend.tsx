import { CATEGORY_META } from "@/components/common/DataCategoryBadge";
import type { DataCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const ORDER: DataCategory[] = ["certo", "regola", "ipotesi", "incerto"];

/** Legenda delle quattro categorie di informazioni, visibile in tutto il percorso. */
export function DataLegend({ className }: { className?: string }) {
  return (
    <section aria-label="Legenda dei tipi di dato" className={cn("rounded-xl border border-border bg-card/60 px-3 py-2", className)}>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        <li className="font-semibold text-muted-foreground">Legenda:</li>
        {ORDER.map((c) => {
          const m = CATEGORY_META[c];
          const Icon = m.Icon;
          return (
            <li key={c} className="flex items-center gap-1.5" title={m.description}>
              <Icon className={cn("h-3.5 w-3.5", m.className.split(" ").find((x) => x.startsWith("text-")))} aria-hidden />
              <span className="font-medium">{m.label}</span>
              <span className="sr-only">: {m.description}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

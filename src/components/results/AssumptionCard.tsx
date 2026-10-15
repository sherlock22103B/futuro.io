import type { Assumption, DataCategory } from "@/lib/types";
import { DataCategoryBadge, CATEGORY_META } from "@/components/common/DataCategoryBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ORDER: DataCategory[] = ["certo", "regola", "ipotesi", "incerto"];

/** Elenco delle ipotesi e dei parametri usati nel calcolo, raggruppati per categoria. */
export function AssumptionCard({ assumptions, title = "Ipotesi utilizzate" }: { assumptions: Assumption[]; title?: string }) {
  const unique = Array.from(new Map(assumptions.map((a) => [a.id, a])).values());
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Ogni numero del risultato deriva da questi valori. Modificali per vedere come cambia il futuro.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {ORDER.map((cat) => {
          const items = unique.filter((a) => a.categoria === cat);
          if (items.length === 0) return null;
          return (
            <section key={cat} aria-label={CATEGORY_META[cat].label}>
              <div className="mb-2">
                <DataCategoryBadge category={cat} />
              </div>
              <dl className="divide-y divide-border/60 rounded-xl border border-border/60">
                {items.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-3 py-2 text-sm">
                    <dt className="text-muted-foreground">
                      {a.etichetta}
                      {a.nota && <span className="block text-xs text-muted-foreground/80">{a.nota}</span>}
                    </dt>
                    <dd className="font-semibold tabular">{a.valore}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}

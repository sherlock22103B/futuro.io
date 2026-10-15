import { Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  numeric?: boolean;
}

/** Tabella testuale che accompagna ogni grafico (alternativa accessibile ai dati visivi). */
export function ChartDataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  highlight,
  summaryLabel = "Mostra i dati in tabella",
  className,
}: {
  caption: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  highlight?: (row: T) => boolean;
  summaryLabel?: string;
  className?: string;
}) {
  return (
    <details className={cn("group rounded-xl border border-border", className)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-sm font-medium hover:bg-accent/40">
        <Table2 className="h-4 w-4" aria-hidden />
        {summaryLabel}
        <span className="ml-auto text-xs text-muted-foreground group-open:hidden">({rows.length} righe)</span>
      </summary>
      <div className="max-h-[420px] overflow-auto border-t border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-card">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn("border-b border-border px-3 py-2 font-semibold", c.numeric ? "text-right" : "text-left")}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)} className={cn("odd:bg-white/[0.02]", highlight?.(r) && "bg-incerto/10")}>
                {columns.map((c, i) =>
                  i === 0 ? (
                    <th key={c.key} scope="row" className="px-3 py-1.5 text-left font-medium tabular">
                      {c.render(r)}
                    </th>
                  ) : (
                    <td key={c.key} className={cn("px-3 py-1.5 tabular", c.numeric && "text-right")}>
                      {c.render(r)}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

import { CheckCircle2, HelpCircle, Landmark, Lightbulb } from "lucide-react";
import type { DataCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export const CATEGORY_META: Record<
  DataCategory,
  { label: string; short: string; description: string; className: string; dot: string; Icon: typeof CheckCircle2 }
> = {
  certo: {
    label: "Dato certo",
    short: "Certo",
    description: "Un dato che conosci e puoi documentare oggi.",
    className: "border-certo/50 bg-certo/10 text-certo",
    dot: "bg-certo",
    Icon: CheckCircle2,
  },
  regola: {
    label: "Regola attuale",
    short: "Regola",
    description: "Un parametro normativo configurato nel sistema.",
    className: "border-regola/50 bg-regola/10 text-regola",
    dot: "bg-regola",
    Icon: Landmark,
  },
  ipotesi: {
    label: "Ipotesi utente",
    short: "Ipotesi",
    description: "Una tua scelta sul futuro: puoi modificarla quando vuoi.",
    className: "border-ipotesi/50 bg-ipotesi/10 text-ipotesi",
    dot: "bg-ipotesi",
    Icon: Lightbulb,
  },
  incerto: {
    label: "Variabile incerta",
    short: "Incerta",
    description: "Questo valore può cambiare e nessuno può conoscerlo in anticipo.",
    className: "border-incerto/50 bg-incerto/10 text-incerto",
    dot: "bg-incerto",
    Icon: HelpCircle,
  },
};

interface DataCategoryBadgeProps {
  category: DataCategory;
  compact?: boolean;
  className?: string;
}

/** Etichetta colorata che indica la natura di un'informazione. Colore + icona + testo (non solo colore). */
export function DataCategoryBadge({ category, compact = false, className }: DataCategoryBadgeProps) {
  const meta = CATEGORY_META[category];
  const Icon = meta.Icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase leading-5 tracking-wide",
        meta.className,
        className,
      )}
      title={meta.description}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {compact ? meta.short : meta.label}
    </span>
  );
}

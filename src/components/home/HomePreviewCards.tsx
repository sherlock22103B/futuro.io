"use client";

import * as React from "react";
import Link from "next/link";
import { Landmark, Scale, TrendingUp } from "lucide-react";
import { useSimulation } from "@/components/providers/SimulationProvider";
import { runSimulation } from "@/lib/scenarios/calculateScenarios";
import { formatEuro } from "@/lib/format";

/** Le tre card sotto l'hero: mostrano i risultati se esiste già una simulazione nel browser. */
export function HomePreviewCards() {
  const { hydrated, validation } = useSimulation();
  const result = React.useMemo(() => (hydrated && validation.ok ? runSimulation(validation.data) : null), [hydrated, validation]);

  const cards = [
    {
      icon: Landmark,
      title: "Pensione pubblica stimata",
      accent: "bg-pension",
      text: "Quanto potresti ricevere dalla previdenza pubblica, calcolato anno per anno con la logica contributiva.",
      value: result ? `${formatEuro(result.pensione.risultato?.pensioneMensileLorda)} lordi/mese` : null,
    },
    {
      icon: TrendingUp,
      title: "Capitale ETF ipotetico",
      accent: "bg-etf",
      text: "Quanto potrebbe valere un piano di accumulo, in tre scenari didattici: prudente, centrale e favorevole.",
      value: result ? `${formatEuro(result.etf.centrale.risultato?.capitaleFinale)} (centrale)` : null,
    },
    {
      icon: Scale,
      title: "Gap previdenziale",
      accent: "bg-incerto",
      text: "La distanza tra il reddito che desideri e quello stimato. Per capire quanto potrebbe mancare, e cosa cambia se agisci oggi.",
      value: result ? (result.reddito.gapReale > 0 ? `${formatEuro(result.reddito.gapReale)}/mese in euro di oggi` : "Nessun gap con queste ipotesi") : null,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((c) => (
        <article key={c.title} className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6">
          <div className={`absolute inset-x-0 top-0 h-1 ${c.accent}`} aria-hidden />
          <c.icon className="h-6 w-6 text-slate-200" aria-hidden />
          <h3 className="mt-3 text-lg font-semibold">{c.title}</h3>
          {c.value ? (
            <p className="mt-2 text-2xl font-bold tabular">{c.value}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
          {c.value && (
            <Link href="/risultati" className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
              Dalla tua simulazione salvata →
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}

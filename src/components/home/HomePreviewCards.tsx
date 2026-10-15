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
      text: "Calcolata anno per anno, con i tuoi contributi.",
      value: result ? `${formatEuro(result.pensione.risultato?.pensioneMensileLorda)} lordi/mese` : null,
    },
    {
      icon: TrendingUp,
      title: "Capitale ETF ipotetico",
      accent: "bg-etf",
      text: "Facoltativo, in tre scenari: prudente, centrale, favorevole.",
      value: result ? (result.etfAttivo ? formatEuro(result.etf.centrale.risultato?.capitaleFinale) : "Non simulato") : null,
    },
    {
      icon: Scale,
      title: "Gap previdenziale",
      accent: "bg-incerto",
      text: "Quanto manca al reddito che desideri.",
      value: result ? (result.reddito.gapReale > 0 ? `${formatEuro(result.reddito.gapReale)}/mese` : "Nessun gap") : null,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <article key={c.title} className="relative overflow-hidden rounded-2xl border border-border bg-card/70 p-5">
            <div className={`absolute inset-x-0 top-0 h-1 ${c.accent}`} aria-hidden />
            <div className="flex items-center gap-2">
              <c.icon className="h-5 w-5 text-slate-300" aria-hidden />
              <h3 className="font-semibold">{c.title}</h3>
            </div>
            {c.value && <p className="mt-3 text-2xl font-bold tabular">{c.value}</p>}
            <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
          </article>
        ))}
      </div>
      {result && (
        <p className="text-sm text-muted-foreground">
          Valori della tua ultima simulazione ·{" "}
          <Link href="/risultati" className="font-medium text-primary underline-offset-4 hover:underline">
            vedi i risultati
          </Link>
        </p>
      )}
    </div>
  );
}

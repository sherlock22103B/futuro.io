"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ETFScenariosOutput, ETFYearRow } from "@/lib/etf/etfTypes";
import { formatEuro, formatEuroCompact } from "@/lib/format";
import { AXIS_TICK, CHART_COLORS } from "./chartTheme";
import { ChartDataTable } from "./ChartDataTable";

/** I tre scenari didattici del piano ETF e i versamenti cumulati (anteprima del passaggio 4). */
export function ETFProjectionChart({ scenarios, reduceMotion }: { scenarios: ETFScenariosOutput; reduceMotion?: boolean }) {
  const c = scenarios.centrale.dettaglio;
  if (c.length === 0) return null;
  const data = c.map((row, i) => ({
    eta: row.eta + 1,
    centrale: row.capitaleFinale,
    prudente: scenarios.prudente.dettaglio[i]?.capitaleFinale ?? null,
    favorevole: scenarios.favorevole.dettaglio[i]?.capitaleFinale ?? null,
    versamenti: row.versamentiCumulati,
  }));
  const r = scenarios.centrale.risultato;
  const lines = [
    { key: "favorevole", label: "Favorevole", color: CHART_COLORS.etf, dash: "2 3", width: 1.5 },
    { key: "centrale", label: "Centrale", color: CHART_COLORS.etf, dash: undefined, width: 2.5 },
    { key: "prudente", label: "Prudente", color: CHART_COLORS.etf, dash: "2 3", width: 1.5 },
    { key: "versamenti", label: "Versamenti cumulati", color: CHART_COLORS.versamenti, dash: "6 4", width: 2 },
  ];
  return (
    <figure className="space-y-3">
      <figcaption className="text-sm font-semibold">Tre scenari didattici per il tuo piano (nominali, prima delle tasse)</figcaption>
      <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground" aria-hidden>
        {lines.map((l) => (
          <li key={l.key} className="flex items-center gap-1.5">
            <svg width="20" height="8">
              <line x1="0" y1="4" x2="20" y2="4" stroke={l.color} strokeWidth={l.width + 0.5} strokeDasharray={l.dash} />
            </svg>
            {l.label}
          </li>
        ))}
      </ul>
      <div
        role="img"
        aria-label={`Capitale finale: prudente ${formatEuro(scenarios.prudente.risultato?.capitaleFinale)}, centrale ${formatEuro(r?.capitaleFinale)}, favorevole ${formatEuro(scenarios.favorevole.risultato?.capitaleFinale)}. Versamenti totali ${formatEuro(r?.versamentiTotali)}.`}
        className="h-56 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="eta" type="number" domain={["dataMin", "dataMax"]} tick={AXIS_TICK} stroke={CHART_COLORS.axis} allowDecimals={false} />
            <YAxis tickFormatter={formatEuroCompact} tick={AXIS_TICK} stroke={CHART_COLORS.axis} width={60} />
            {lines.map((l) => (
              <Line
                key={l.key}
                dataKey={l.key}
                name={l.label}
                stroke={l.color}
                strokeWidth={l.width}
                strokeDasharray={l.dash}
                dot={false}
                isAnimationActive={!reduceMotion}
              />
            ))}
            <Tooltip
              contentStyle={{ background: "#13213d", border: "1px solid #2a3b5f", borderRadius: 12, color: "#e2e8f0" }}
              labelFormatter={(v) => `A ${v} anni`}
              formatter={(v: number, name: string) => [formatEuro(v), name]}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable<ETFYearRow>
        caption="Piano ETF anno per anno, scenario centrale"
        rows={c}
        rowKey={(row) => row.annoIndice}
        columns={[
          { key: "eta", header: "Età", render: (row) => row.eta },
          { key: "ci", header: "Capitale iniziale", numeric: true, render: (row) => formatEuro(row.capitaleIniziale) },
          { key: "vc", header: "Versamenti cumulati", numeric: true, render: (row) => formatEuro(row.versamentiCumulati) },
          { key: "rl", header: "Rendimento lordo cumulato", numeric: true, render: (row) => formatEuro(row.rendimentoLordoCumulato) },
          { key: "cc", header: "Costi cumulati", numeric: true, render: (row) => formatEuro(row.costiCumulati) },
          { key: "cf", header: "Capitale finale", numeric: true, render: (row) => formatEuro(row.capitaleFinale) },
          { key: "cr", header: "In euro di oggi", numeric: true, render: (row) => formatEuro(row.capitaleFinaleReale) },
        ]}
      />
    </figure>
  );
}

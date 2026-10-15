"use client";

import { Area, AreaChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PensionYearRow } from "@/lib/pension/pensionTypes";
import { formatEuro, formatEuroCompact } from "@/lib/format";
import { AXIS_TICK, CHART_COLORS } from "./chartTheme";
import { ChartDataTable } from "./ChartDataTable";

/** Crescita del montante contributivo anno per anno (anteprima del passaggio 3). */
export function PensionProjectionChart({ rows, reduceMotion }: { rows: PensionYearRow[]; reduceMotion?: boolean }) {
  if (rows.length === 0) return null;
  const data = rows.map((r) => ({ ...r, etaFine: r.eta + 1 }));
  const last = rows[rows.length - 1];
  const gaps = rows.filter((r) => r.senzaContributi);
  return (
    <figure className="space-y-3">
      <figcaption className="text-sm font-semibold">Come cresce il tuo montante contributivo</figcaption>
      <div
        role="img"
        aria-label={`Il montante passa da ${formatEuro(rows[0].montanteIniziale)} a ${formatEuro(last.montanteFinale)} a ${last.eta + 1} anni.${gaps.length ? ` ${gaps.length} anni senza contributi evidenziati in arancione.` : ""}`}
        className="h-56 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradMontante" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.pensione} stopOpacity={0.45} />
                <stop offset="100%" stopColor={CHART_COLORS.pensione} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="etaFine" type="number" domain={["dataMin", "dataMax"]} tick={AXIS_TICK} stroke={CHART_COLORS.axis} allowDecimals={false} />
            <YAxis tickFormatter={formatEuroCompact} tick={AXIS_TICK} stroke={CHART_COLORS.axis} width={60} />
            {gaps.map((g) => (
              <ReferenceArea key={g.eta} x1={g.eta + 0.5} x2={g.eta + 1.5} fill={CHART_COLORS.gap} fillOpacity={0.2} stroke="none" ifOverflow="hidden" />
            ))}
            <Area
              dataKey="montanteFinale"
              stroke={CHART_COLORS.pensione}
              strokeWidth={2}
              fill="url(#gradMontante)"
              isAnimationActive={!reduceMotion}
              name="Montante"
            />
            <Tooltip
              contentStyle={{ background: "#13213d", border: "1px solid #2a3b5f", borderRadius: 12, color: "#e2e8f0" }}
              labelFormatter={(v) => `A ${v} anni`}
              formatter={(v: number) => [formatEuro(v), "Montante"]}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable<PensionYearRow>
        caption="Montante contributivo anno per anno"
        rows={rows}
        rowKey={(r) => r.eta}
        highlight={(r) => r.senzaContributi}
        columns={[
          { key: "eta", header: "Età", render: (r) => `${r.eta}${r.senzaContributi ? " ●" : ""}` },
          { key: "anno", header: "Anno", render: (r) => r.anno },
          { key: "stip", header: "Stipendio", numeric: true, render: (r) => formatEuro(r.stipendio) },
          { key: "contr", header: "Contributi", numeric: true, render: (r) => formatEuro(r.contributi) },
          { key: "mi", header: "Montante iniziale", numeric: true, render: (r) => formatEuro(r.montanteIniziale) },
          { key: "riv", header: "Rivalutazione", numeric: true, render: (r) => formatEuro(r.rivalutazione) },
          { key: "mf", header: "Montante finale", numeric: true, render: (r) => formatEuro(r.montanteFinale) },
        ]}
      />
    </figure>
  );
}

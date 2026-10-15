"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RetirementIncomeSummary } from "@/lib/scenarios/calculateScenarios";
import { formatEuro, formatEuroCompact } from "@/lib/format";
import { AXIS_TICK, CHART_COLORS } from "./chartTheme";

interface Props {
  reddito: RetirementIncomeSummary;
  real: boolean;
  showEtf: boolean;
  showInvalidita: boolean;
  reduceMotion?: boolean;
}

/** Barre sovrapposte: pensione + invalidità + integrazione ETF + gap a confronto con il reddito desiderato. */
export function RetirementIncomeChart({ reddito, real, showEtf, showInvalidita, reduceMotion }: Props) {
  const pensione = real ? reddito.pensioneMediaMensileReale : reddito.pensioneMediaMensile;
  const invalidita = real ? reddito.invaliditaMensileReale : reddito.invaliditaMensile;
  const etf = real ? reddito.etfMensileReale : reddito.etfMensile;
  const desiderato = real ? reddito.desideratoReale : reddito.desideratoNominale;
  const gap = real ? reddito.gapReale : reddito.gapNominale;
  const totale = pensione + invalidita + etf;

  const data = [
    { nome: "Reddito stimato", pensione, invalidita, etf, gap, desiderato: 0 },
    { nome: "Reddito desiderato", pensione: 0, invalidita: 0, etf: 0, gap: 0, desiderato },
  ];

  const legend = [
    { label: "Pensione pubblica (media mensile)", color: CHART_COLORS.pensione, value: pensione, show: true },
    { label: "Pensione di invalidità (indicata da te)", color: CHART_COLORS.invalidita, value: invalidita, show: showInvalidita },
    { label: "Integrazione ETF ipotetica", color: CHART_COLORS.etf, value: etf, show: showEtf },
    { label: "Gap mensile", color: CHART_COLORS.gap, value: gap, show: true },
    { label: "Reddito desiderato", color: CHART_COLORS.desiderato, value: desiderato, show: true },
  ].filter((l) => l.show);

  return (
    <figure className="space-y-3">
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        {legend.map((l) => (
          <li key={l.label} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: l.color }} aria-hidden />
            <span className="text-muted-foreground">{l.label}:</span>
            <span className="ml-auto font-semibold tabular">{formatEuro(l.value)}</span>
          </li>
        ))}
        <li className="flex items-center gap-2 border-t border-border pt-2 sm:col-span-2">
          <span className="font-medium">Reddito pensionistico complessivo stimato:</span>
          <span className="ml-auto font-bold tabular">{formatEuro(totale)}</span>
        </li>
      </ul>
      <div
        role="img"
        aria-label={`Reddito mensile stimato ${formatEuro(totale)} (pensione ${formatEuro(pensione)}${showInvalidita ? `, pensione di invalidità ${formatEuro(invalidita)}` : ""}${showEtf ? `, integrazione ETF ${formatEuro(etf)}` : ""}) contro un reddito desiderato di ${formatEuro(desiderato)}. Gap: ${formatEuro(gap)}.`}
        className="h-64 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="nome" tick={AXIS_TICK} stroke={CHART_COLORS.axis} />
            <YAxis tickFormatter={formatEuroCompact} tick={AXIS_TICK} stroke={CHART_COLORS.axis} width={60} />
            <Bar dataKey="pensione" stackId="a" fill={CHART_COLORS.pensione} stroke={CHART_COLORS.surface} strokeWidth={2} name="Pensione" isAnimationActive={!reduceMotion} />
            {showInvalidita && (
              <Bar dataKey="invalidita" stackId="a" fill={CHART_COLORS.invalidita} stroke={CHART_COLORS.surface} strokeWidth={2} name="Pensione di invalidità" isAnimationActive={!reduceMotion} />
            )}
            {showEtf && (
              <Bar dataKey="etf" stackId="a" fill={CHART_COLORS.etf} stroke={CHART_COLORS.surface} strokeWidth={2} name="Integrazione ETF" isAnimationActive={!reduceMotion} />
            )}
            <Bar
              dataKey="gap"
              stackId="a"
              fill={CHART_COLORS.gap}
              fillOpacity={0.35}
              stroke={CHART_COLORS.gap}
              strokeDasharray="4 3"
              strokeWidth={1.5}
              name="Gap"
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reduceMotion}
            />
            <Bar dataKey="desiderato" stackId="a" fill={CHART_COLORS.desiderato} name="Desiderato" radius={[4, 4, 0, 0]} isAnimationActive={!reduceMotion}>
              <LabelList dataKey="desiderato" position="top" formatter={(v: number) => (v > 0 ? formatEuro(v) : "")} fill="#e2e8f0" fontSize={12} />
            </Bar>
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.08)" }}
              contentStyle={{ background: "#13213d", border: "1px solid #2a3b5f", borderRadius: 12, color: "#e2e8f0" }}
              formatter={(v: number, name: string) => (v > 0 ? [formatEuro(v), name] : [null, null])}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="text-xs text-muted-foreground">
        Valori mensili {real ? "in euro di oggi" : "nominali, in euro dell'anno di pensionamento"}, al lordo delle imposte. La pensione è la media su 12
        mesi (pensione annua ÷ 12).{showEtf && " L'integrazione ETF è una simulazione di prelievo e non una rendita garantita."}
      </figcaption>
    </figure>
  );
}

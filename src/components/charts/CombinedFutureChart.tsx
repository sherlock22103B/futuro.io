"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { Download } from "lucide-react";
import type { ChartPoint, SimulationResult } from "@/lib/scenarios/calculateScenarios";
import { formatEuro, formatEuroCompact } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { AXIS_TICK, CHART_COLORS } from "./chartTheme";
import { ChartDataTable } from "./ChartDataTable";
import { downloadChartAsPng } from "./downloadChart";
import { cn } from "@/lib/utils";

type ValueMode = "nominale" | "reale";
type XMode = "eta" | "anno";
type SeriesKey = "montante" | "etf" | "range" | "versamenti" | "scenari";

const SERIES: { key: SeriesKey; label: string; color: string; style: "line" | "dashed" | "band" | "dotted" }[] = [
  { key: "montante", label: "Montante contributivo", color: CHART_COLORS.pensione, style: "line" },
  { key: "etf", label: "Capitale ETF (centrale)", color: CHART_COLORS.etf, style: "line" },
  { key: "range", label: "Intervallo prudente–favorevole", color: CHART_COLORS.etfBand, style: "band" },
  { key: "versamenti", label: "Versamenti ETF cumulati", color: CHART_COLORS.versamenti, style: "dashed" },
  { key: "scenari", label: "Linee prudente e favorevole", color: CHART_COLORS.etf, style: "dotted" },
];

function gapRanges(points: ChartPoint[]): [number, number][] {
  const out: [number, number][] = [];
  let start: number | null = null;
  for (const p of points) {
    if (p.senzaContributi && start === null) start = p.eta;
    if (!p.senzaContributi && start !== null) {
      out.push([start, p.eta]);
      start = null;
    }
  }
  if (start !== null) out.push([start, points[points.length - 1].eta]);
  return out;
}

function TooltipContent({ active, payload, valueMode, etfOn }: TooltipProps<number, string> & { valueMode: ValueMode; etfOn: boolean }) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload as ChartPoint;
  const real = valueMode === "reale";
  const rows: [string, string, string?][] = [
    ["Stipendio stimato (anno)", p.stipendio === null ? "—" : formatEuro(p.stipendio)],
    ["Contributi dell'anno", p.contributi === null ? "—" : formatEuro(p.contributi)],
    ["Montante pensionistico", formatEuro(real ? p.montanteReale : p.montante), CHART_COLORS.pensione],
    ["Montante in euro di oggi", formatEuro(p.montanteReale)],
  ];
  if (etfOn) {
    rows.push(
      ["Versamenti ETF cumulati", formatEuro(real ? p.versamentiCumulatiReali : p.versamentiCumulati), CHART_COLORS.versamenti],
      ["Rendimenti ETF lordi cumulati", formatEuro(p.rendimentiCumulati)],
      ["Costi ETF cumulati", formatEuro(p.costiCumulati)],
      ["Capitale ETF (centrale)", formatEuro(real ? p.etfCentraleReale : p.etfCentrale), CHART_COLORS.etf],
      ["Prudente / favorevole", `${formatEuro(real ? p.etfPrudenteReale : p.etfPrudente)} / ${formatEuro(real ? p.etfFavorevoleReale : p.etfFavorevole)}`],
      ["Capitale ETF in euro di oggi", formatEuro(p.etfCentraleReale)],
    );
  }
  return (
    <div className="max-w-xs rounded-xl border border-border bg-popover/95 p-3 text-xs shadow-xl">
      <p className="mb-2 text-sm font-semibold">
        {p.eta} anni · {p.anno}
        {p.senzaContributi && <span className="ml-2 rounded bg-incerto/20 px-1.5 py-0.5 text-[10px] text-incerto">senza contributi</span>}
      </p>
      <dl className="space-y-1">
        {rows.map(([k, v, color]) => (
          <div key={k} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              {color && <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />}
              {k}
            </dt>
            <dd className="font-semibold tabular text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Valori {real ? "in euro di oggi (corretti per l'inflazione ipotizzata)" : "nominali"}. Rendimenti e costi sono nominali. Prima della tassazione.
      </p>
    </div>
  );
}

interface CombinedFutureChartProps {
  result: SimulationResult;
  reduceMotion?: boolean;
}

/** "Le due strade verso il tuo futuro": montante pensionistico e capitale ETF nel tempo. */
export function CombinedFutureChart({ result, reduceMotion }: CombinedFutureChartProps) {
  const [valueMode, setValueMode] = React.useState<ValueMode>("nominale");
  const [xMode, setXMode] = React.useState<XMode>("eta");
  const [visible, setVisible] = React.useState<Record<SeriesKey, boolean>>({
    montante: true,
    etf: true,
    range: true,
    versamenti: true,
    scenari: false,
  });
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [downloadError, setDownloadError] = React.useState(false);

  const real = valueMode === "reale";
  const etfOn = result.etfAttivo;
  const data = result.serie.map((p) => ({
    ...p,
    x: xMode === "eta" ? p.eta : p.anno,
    vMontante: real ? p.montanteReale : p.montante,
    vEtf: real ? p.etfCentraleReale : p.etfCentrale,
    vRange: real ? p.etfRangeReale : p.etfRange,
    vVersamenti: real ? p.versamentiCumulatiReali : p.versamentiCumulati,
    vPrudente: real ? p.etfPrudenteReale : p.etfPrudente,
    vFavorevole: real ? p.etfFavorevoleReale : p.etfFavorevole,
  }));

  const etaPens = result.input.personal.etaPensionamento;
  const toX = (eta: number) => (xMode === "eta" ? eta : result.annoCorrente + (eta - result.input.personal.eta));
  const gaps = gapRanges(result.serie);
  const last = result.serie[result.serie.length - 1];
  const finalMontante = result.pensione.risultato?.montanteFinale ?? 0;
  const finalEtf = result.etf.centrale.risultato?.capitaleFinale ?? 0;

  const summary = `Grafico a linee dall'età di ${result.input.personal.eta} a ${last?.eta} anni. Il montante contributivo arriva a ${formatEuro(finalMontante)} a ${etaPens} anni. ${etfOn ? `Il capitale ETF nello scenario centrale arriva a ${formatEuro(finalEtf)} a ${result.valoriAutomatici.etaUtilizzo} anni, con un intervallo tra ${formatEuro(result.etf.prudente.risultato?.capitaleFinale)} e ${formatEuro(result.etf.favorevole.risultato?.capitaleFinale)}.` : "Nessun piano ETF simulato."}${gaps.length ? ` Sono presenti ${result.pensione.risultato?.anniSenzaContributi ?? 0} anni senza contributi.` : ""}`;

  return (
    <section aria-labelledby="chart-main-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="chart-main-title" className="text-xl font-bold sm:text-2xl">
            {etfOn ? "Le due strade verso il tuo futuro" : "Come cresce la tua pensione"}
          </h2>
          <p className="text-sm text-muted-foreground">Valore accumulato in euro, anno dopo anno. Prima dell&apos;eventuale tassazione.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const ok = await downloadChartAsPng(chartRef.current, "futuro-io-grafico.png", "Le due strade verso il tuo futuro");
            setDownloadError(!ok);
          }}
        >
          <Download aria-hidden /> Scarica immagine
        </Button>
      </div>
      {downloadError && (
        <p role="alert" className="text-sm text-incerto">
          Non è stato possibile creare l&apos;immagine in questo browser. Puoi usare la stampa o la tabella dei dati.
        </p>
      )}

      {/* Controlli */}
      <div className="flex flex-wrap gap-3">
        <SegmentedControl
          label="Valori"
          value={valueMode}
          onChange={(v) => setValueMode(v as ValueMode)}
          options={[
            { value: "nominale", label: "Nominali" },
            { value: "reale", label: "In euro di oggi" },
          ]}
        />
        <SegmentedControl
          label="Asse orizzontale"
          value={xMode}
          onChange={(v) => setXMode(v as XMode)}
          options={[
            { value: "eta", label: "Età" },
            { value: "anno", label: "Anno" },
          ]}
        />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Mostra nel grafico</legend>
        <div className="flex flex-wrap gap-2">
          {SERIES.filter((s) => etfOn || s.key === "montante").map((s) => (
            <label
              key={s.key}
              className={cn(
                "flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-medium focus-within:ring-2 focus-within:ring-ring",
                visible[s.key] ? "border-border bg-accent/60" : "border-border/60 text-muted-foreground",
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--primary))]"
                checked={visible[s.key]}
                onChange={(e) => setVisible((v) => ({ ...v, [s.key]: e.target.checked }))}
              />
              <SeriesSwatch color={s.color} style={s.style} />
              {s.label === "Linee prudente e favorevole" ? "Confronta gli scenari" : s.label}
            </label>
          ))}
          <span className="flex min-h-10 items-center gap-2 px-2 text-xs text-muted-foreground">
            <span className="inline-block h-3 w-3 rounded-full border-2" style={{ borderColor: CHART_COLORS.gap, background: CHART_COLORS.surface }} aria-hidden />
            Anni senza contributi
          </span>
          <span className="flex min-h-10 items-center gap-2 px-2 text-xs text-muted-foreground">
            <span className="inline-block h-4 w-0 border-l-2 border-dashed border-slate-300" aria-hidden />
            Pensionamento
          </span>
        </div>
      </fieldset>

      <div ref={chartRef} role="img" aria-label={summary} className="h-[340px] w-full sm:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 12, bottom: 8, left: 4 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="x"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={AXIS_TICK}
              stroke={CHART_COLORS.axis}
              tickCount={8}
              allowDecimals={false}
              label={{ value: xMode === "eta" ? "Età" : "Anno", position: "insideBottomRight", offset: -4, fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis tickFormatter={formatEuroCompact} tick={AXIS_TICK} stroke={CHART_COLORS.axis} width={64} />
            {gaps.map(([a, b]) => (
              <ReferenceArea key={`gap-${a}`} x1={toX(a)} x2={toX(b)} fill={CHART_COLORS.gap} fillOpacity={0.12} stroke="none" ifOverflow="hidden" />
            ))}
            {etfOn && visible.range && (
              <Area
                dataKey="vRange"
                stroke="none"
                fill={CHART_COLORS.etfBand}
                fillOpacity={0.16}
                isAnimationActive={!reduceMotion}
                name="Intervallo prudente–favorevole"
                activeDot={false}
              />
            )}
            {etfOn && visible.versamenti && (
              <Line
                dataKey="vVersamenti"
                stroke={CHART_COLORS.versamenti}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={!reduceMotion}
                name="Versamenti ETF cumulati"
              />
            )}
            {etfOn && visible.scenari && (
              <Line dataKey="vPrudente" stroke={CHART_COLORS.prudente} strokeWidth={1.5} strokeDasharray="2 3" dot={false} isAnimationActive={!reduceMotion} name="ETF prudente" />
            )}
            {etfOn && visible.scenari && (
              <Line dataKey="vFavorevole" stroke={CHART_COLORS.favorevole} strokeWidth={1.5} strokeDasharray="2 3" dot={false} isAnimationActive={!reduceMotion} name="ETF favorevole" />
            )}
            {etfOn && visible.etf && (
              <Line
                dataKey="vEtf"
                stroke={CHART_COLORS.etf}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
                isAnimationActive={!reduceMotion}
                name="Capitale ETF (centrale)"
              />
            )}
            {visible.montante && (
              <Line
                dataKey="vMontante"
                stroke={CHART_COLORS.pensione}
                strokeWidth={2.5}
                connectNulls={false}
                isAnimationActive={!reduceMotion}
                name="Montante contributivo"
                activeDot={{ r: 5, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
                dot={(props: { cx?: number; cy?: number; payload?: ChartPoint; index?: number }) => {
                  const { cx, cy, payload, index } = props;
                  if (!payload?.senzaContributi || cx === undefined || cy === undefined) {
                    return <g key={`d-${index}`} />;
                  }
                  return (
                    <circle
                      key={`d-${index}`}
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={CHART_COLORS.surface}
                      stroke={CHART_COLORS.gap}
                      strokeWidth={2.5}
                    />
                  );
                }}
              />
            )}
            <ReferenceLine
              x={toX(etaPens)}
              stroke="#cbd5e1"
              strokeDasharray="5 5"
              label={{ value: "Pensione", position: "insideTopRight", fill: "#e2e8f0", fontSize: 12 }}
            />
            <Tooltip content={<TooltipContent valueMode={valueMode} etfOn={etfOn} />} cursor={{ stroke: "#64748b", strokeWidth: 1 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <ChartDataTable<ChartPoint>
        caption="Dati anno per anno del grafico Le due strade verso il tuo futuro"
        rows={result.serie}
        rowKey={(r) => r.eta}
        highlight={(r) => r.senzaContributi}
        columns={[
          { key: "eta", header: "Età", render: (r) => `${r.eta}${r.senzaContributi ? " ●" : ""}` },
          { key: "anno", header: "Anno", render: (r) => r.anno },
          { key: "stip", header: "Stipendio", numeric: true, render: (r) => formatEuro(r.stipendio) },
          { key: "contr", header: "Contributi", numeric: true, render: (r) => formatEuro(r.contributi) },
          { key: "mont", header: "Montante", numeric: true, render: (r) => formatEuro(r.montante) },
          ...(etfOn
            ? [
                { key: "vers", header: "Versamenti ETF", numeric: true, render: (r: ChartPoint) => formatEuro(r.versamentiCumulati) },
                { key: "rend", header: "Rendimenti ETF", numeric: true, render: (r: ChartPoint) => formatEuro(r.rendimentiCumulati) },
                { key: "costi", header: "Costi ETF", numeric: true, render: (r: ChartPoint) => formatEuro(r.costiCumulati) },
                { key: "etf", header: "Capitale ETF", numeric: true, render: (r: ChartPoint) => formatEuro(r.etfCentrale) },
                { key: "etfr", header: "ETF in euro di oggi", numeric: true, render: (r: ChartPoint) => formatEuro(r.etfCentraleReale) },
              ]
            : []),
        ]}
      />
      {gaps.length > 0 && <p className="text-xs text-muted-foreground">● = anno senza contributi.</p>}
    </section>
  );
}

function SeriesSwatch({ color, style }: { color: string; style: "line" | "dashed" | "band" | "dotted" }) {
  if (style === "band") return <span className="inline-block h-3 w-5 rounded-sm" style={{ background: color, opacity: 0.35 }} aria-hidden />;
  return (
    <svg width="20" height="8" aria-hidden>
      <line
        x1="0"
        y1="4"
        x2="20"
        y2="4"
        stroke={color}
        strokeWidth={style === "line" ? 3 : 2}
        strokeDasharray={style === "dashed" ? "5 3" : style === "dotted" ? "2 2" : undefined}
      />
    </svg>
  );
}

export function SegmentedControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const name = React.useId();
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{label}</legend>
      <span className="text-xs font-medium text-muted-foreground" aria-hidden>
        {label}:
      </span>
      <div className="inline-flex rounded-lg bg-secondary/70 p-1">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "flex min-h-9 cursor-pointer items-center rounded-md px-3 text-xs font-medium focus-within:ring-2 focus-within:ring-ring",
              value === o.value ? "bg-background text-foreground shadow" : "text-muted-foreground",
            )}
          >
            <input type="radio" className="sr-only" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

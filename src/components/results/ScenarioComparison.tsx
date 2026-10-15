"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useSimulation, usePrefersReducedMotion } from "@/components/providers/SimulationProvider";
import { compareScenarios } from "@/lib/scenarios/calculateScenarios";
import { MAX_SAVED_SCENARIOS, SCENARIO_NAME_PRESETS } from "@/config/simulationDefaults";
import { formatEuro, formatEuroCompact, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, LoadingState } from "@/components/common/States";
import { AXIS_TICK, CHART_COLORS } from "@/components/charts/chartTheme";

/** Gestione (rinomina, duplica, modifica, elimina) e confronto di fino a tre scenari salvati. */
export function ScenarioComparison() {
  const { hydrated, scenarios, validation, saveScenario, updateScenario, duplicateScenario, deleteScenario, replaceDraft, setActiveScenarioId } =
    useSimulation();
  const reduceMotion = usePrefersReducedMotion();
  const router = useRouter();
  const [editing, setEditing] = React.useState<string | null>(null);
  const [nameDraft, setNameDraft] = React.useState("");
  const [now] = React.useState(() => new Date());

  const rows = React.useMemo(() => compareScenarios(scenarios, undefined, now), [scenarios, now]);

  if (!hydrated) return <LoadingState />;

  const canAdd = scenarios.length < MAX_SAVED_SCENARIOS;
  const nextName = SCENARIO_NAME_PRESETS.find((p) => !scenarios.some((s) => s.nome === p)) ?? `Scenario ${scenarios.length + 1}`;

  const addCurrent = (
    <Button
      disabled={!canAdd || !validation.ok}
      onClick={() => {
        if (validation.ok) saveScenario(nextName, validation.data);
      }}
    >
      <Plus aria-hidden /> Salva la simulazione attuale come «{nextName}»
    </Button>
  );

  if (scenarios.length === 0) {
    return (
      <EmptyState
        title="Nessuno scenario salvato"
        description={
          validation.ok
            ? "Salva la simulazione attuale come primo scenario, poi modificala (ad esempio iniziando prima o versando di più) e salva gli altri."
            : "Completa prima una simulazione: potrai salvarla e confrontarla con altre due varianti."
        }
        action={validation.ok ? addCurrent : <Button asChild><Link href="/simulatore">Vai al simulatore</Link></Button>}
      />
    );
  }

  const chartData = rows.map((r) => ({
    nome: r.nome,
    pensione: Math.round(r.pensioneMediaMensileReale),
    redditoTotale: Math.round(r.redditoComplessivoReale),
    desiderato: Math.round(r.desideratoReale),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        {addCurrent}
        <p className="text-sm text-muted-foreground">
          {scenarios.length} di {MAX_SAVED_SCENARIOS} scenari salvati.
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-3">
        {scenarios.map((s) => (
          <li key={s.id}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                {editing === s.id ? (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateScenario(s.id, { nome: nameDraft });
                      setEditing(null);
                    }}
                  >
                    <label htmlFor={`nome-${s.id}`} className="sr-only">
                      Nuovo nome dello scenario
                    </label>
                    <Input id={`nome-${s.id}`} value={nameDraft} maxLength={60} autoFocus onChange={(e) => setNameDraft(e.target.value)} />
                    <Button type="submit" size="icon" aria-label="Conferma il nuovo nome">
                      <Check aria-hidden />
                    </Button>
                  </form>
                ) : (
                  <CardTitle>{s.nome}</CardTitle>
                )}
                <CardDescription>Aggiornato il {formatDate(s.aggiornatoIl)}{s.input.meta.isDemo ? " · dati demo" : ""}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(s.id);
                    setNameDraft(s.nome);
                  }}
                >
                  <Pencil aria-hidden /> Rinomina
                </Button>
                <Button size="sm" variant="outline" disabled={!canAdd} onClick={() => duplicateScenario(s.id)}>
                  <Copy aria-hidden /> Duplica
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    replaceDraft(s.input);
                    setActiveScenarioId(s.id);
                    router.push("/simulatore?passo=1");
                  }}
                >
                  <Pencil aria-hidden /> Modifica
                </Button>
                <ConfirmDialog
                  title={`Eliminare «${s.nome}»?`}
                  description="Lo scenario verrà eliminato da questo dispositivo."
                  confirmLabel="Elimina"
                  destructive
                  onConfirm={() => deleteScenario(s.id)}
                  trigger={
                    <Button size="sm" variant="outline" className="text-red-200">
                      <Trash2 aria-hidden /> Elimina
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <Card>
        <CardHeader>
          <CardTitle>Tabella comparativa</CardTitle>
          <CardDescription>Importi lordi. Il reddito complessivo e il gap sono medie mensili in euro di oggi.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">Confronto tra gli scenari salvati</caption>
            <thead>
              <tr>
                <th scope="col" className="border-b border-border px-3 py-2 text-left">Voce</th>
                {rows.map((r) => (
                  <th key={r.id} scope="col" className="border-b border-border px-3 py-2 text-right">{r.nome}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Età di pensionamento", (r) => `${r.etaPensionamento} anni`],
                  ["Contributi futuri", (r) => formatEuro(r.contributiFuturi)],
                  ["Pensione pubblica stimata (lorda mensile)", (r) => formatEuro(r.pensioneMensileLorda)],
                  ["… in euro di oggi", (r) => formatEuro(r.pensioneMensileLordaReale)],
                  ["Pensione di invalidità", (r) => (r.invaliditaMensileReale > 0 ? formatEuro(r.invaliditaMensileReale) : "—")],
                  ["Piano ETF", (r) => (r.etfAttivo ? "Sì" : "Non simulato")],
                  ["Versamento ETF mensile", (r) => formatEuro(r.versamentoMensile)],
                  ["Capitale ETF (centrale)", (r) => formatEuro(r.capitaleETF)],
                  ["Capitale ETF prudente – favorevole", (r) => `${formatEuro(r.capitaleETFPrudente)} – ${formatEuro(r.capitaleETFFavorevole)}`],
                  ["Reddito futuro complessivo", (r) => formatEuro(r.redditoComplessivoReale)],
                  ["Reddito desiderato", (r) => formatEuro(r.desideratoReale)],
                  ["Gap mensile", (r) => (r.gapReale > 0 ? formatEuro(r.gapReale) : "Nessun gap")],
                ] as [string, (r: (typeof rows)[number]) => string][]
              ).map(([label, fn]) => (
                <tr key={label} className="odd:bg-white/[0.02]">
                  <th scope="row" className="px-3 py-2 text-left font-medium">{label}</th>
                  {rows.map((r) => (
                    <td key={r.id} className="px-3 py-2 text-right tabular">{fn(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reddito mensile a confronto</CardTitle>
          <CardDescription>In euro di oggi, media su 12 mesi.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground" aria-hidden>
            <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: CHART_COLORS.pensione }} /> Pensione</li>
            <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: CHART_COLORS.etf }} /> Reddito complessivo</li>
            <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: CHART_COLORS.desiderato }} /> Desiderato</li>
          </ul>
          <div
            className="h-64"
            role="img"
            aria-label={rows.map((r) => `${r.nome}: reddito complessivo ${formatEuro(r.redditoComplessivoReale)}, desiderato ${formatEuro(r.desideratoReale)}`).join("; ")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nome" tick={AXIS_TICK} stroke={CHART_COLORS.axis} />
                <YAxis tickFormatter={formatEuroCompact} tick={AXIS_TICK} stroke={CHART_COLORS.axis} width={60} />
                <Bar dataKey="pensione" name="Pensione (media mensile)" fill={CHART_COLORS.pensione} radius={[4, 4, 0, 0]} isAnimationActive={!reduceMotion} />
                <Bar dataKey="redditoTotale" name="Reddito complessivo" fill={CHART_COLORS.etf} radius={[4, 4, 0, 0]} isAnimationActive={!reduceMotion} />
                <Bar dataKey="desiderato" name="Desiderato" fill={CHART_COLORS.desiderato} radius={[4, 4, 0, 0]} isAnimationActive={!reduceMotion} />
                <Tooltip
                  cursor={{ fill: "rgba(148,163,184,0.08)" }}
                  contentStyle={{ background: "#13213d", border: "1px solid #2a3b5f", borderRadius: 12, color: "#e2e8f0" }}
                  formatter={(v: number, n: string) => [formatEuro(v), n]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

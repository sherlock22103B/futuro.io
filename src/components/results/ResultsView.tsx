"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarDays, FileText, FlaskConical } from "lucide-react";
import { useSimulation, usePrefersReducedMotion } from "@/components/providers/SimulationProvider";
import { applyWhatIf, runSimulation, type WhatIfOverrides } from "@/lib/scenarios/calculateScenarios";
import { ErrorState, LoadingState } from "@/components/common/States";
import { Stepper } from "@/components/forms/Stepper";
import { DataLegend } from "@/components/layout/DataLegend";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { ResultCards } from "./GapCard";
import { WhatIfPanel } from "./WhatIfPanel";
import { CombinedFutureChart, SegmentedControl } from "@/components/charts/CombinedFutureChart";
import { RetirementIncomeChart } from "@/components/charts/RetirementIncomeChart";
import { WithdrawalControls } from "./WithdrawalControls";
import { DataCompletenessIndicator } from "./DataCompletenessIndicator";
import { AssumptionCard } from "./AssumptionCard";
import { SaveScenarioDialog } from "./SaveScenarioDialog";
import { DataActions } from "./DataActions";
import { FinalMessage } from "./FinalMessage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatDate, formatEuro } from "@/lib/format";
import { pensionParameters } from "@/config/pensionParameters";
import { STEPS } from "@/components/forms/Stepper";

export function ResultsView() {
  const { hydrated, validation, updateSection, replaceDraft, loadDemo, draft } = useSimulation();
  const reduceMotion = usePrefersReducedMotion();
  const router = useRouter();
  const [now] = React.useState(() => new Date());
  const [overrides, setOverrides] = React.useState<WhatIfOverrides>({});
  const [incomeReal, setIncomeReal] = React.useState(true);

  const base = validation.ok ? validation.data : null;
  const baseResult = React.useMemo(() => (base ? runSimulation(base, pensionParameters, now) : null), [base, now]);
  const effectiveInput = React.useMemo(() => (base ? applyWhatIf(base, overrides) : null), [base, overrides]);
  const result = React.useMemo(() => {
    if (!effectiveInput || !baseResult) return null;
    return Object.keys(overrides).length === 0 ? baseResult : runSimulation(effectiveInput, pensionParameters, now);
  }, [effectiveInput, baseResult, overrides, now]);

  if (!hydrated) return <LoadingState />;

  if (!validation.ok || !base || !result || !baseResult || !effectiveInput) {
    const issues = validation.ok ? [] : validation.issues;
    const bySteps = Array.from(new Set(issues.map((i) => i.step))).sort();
    return (
      <div className="space-y-6">
        <ErrorState
          title="Per vedere il tuo futuro mancano alcuni dati"
          messages={
            bySteps.length
              ? bySteps.map((s) => ({
                  text: `Passaggio ${s} «${STEPS[s - 1]?.title}»: ${issues.filter((i) => i.step === s).length} campi da completare o correggere`,
                  href: `/simulatore?passo=${Math.min(s, 4)}`,
                }))
              : [{ text: "Completa il simulatore", href: "/simulatore" }]
          }
          action={
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild>
                <Link href={`/simulatore?passo=${Math.min(bySteps[0] ?? 1, 4)}`}>Completa i dati</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  loadDemo();
                }}
              >
                <FlaskConical aria-hidden /> Prova con dati dimostrativi
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (result.errori.length > 0) {
    return <ErrorState title="Il calcolo non è possibile con questi dati" messages={result.errori.map((t) => ({ text: t }))} />;
  }

  const warnings = Array.from(new Set([...result.avvisiInput.map((w) => w.messaggio), ...result.avvisi]));

  return (
    <div className="space-y-8">
      <Stepper
        current={5}
        completed={[1, 2, 3, 4, 5]}
        onSelect={(s) => (s < 5 ? router.push(`/simulatore?passo=${s}`) : undefined)}
      />
      <DataLegend />

      {draft.meta.isDemo && (
        <p className="rounded-lg border border-amber-300/50 bg-amber-300/10 px-4 py-3 text-sm text-amber-100" role="status">
          <strong>Dati dimostrativi inventati.</strong> Servono solo a mostrare il funzionamento: non sono una media italiana né un dato ufficiale.{" "}
          <Link className="underline underline-offset-4" href="/simulatore?passo=1">
            Inserisci i tuoi dati
          </Link>
          .
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" aria-hidden /> Calcolo del {formatDateTime(result.calcolatoIl)}
        </span>
        <span>Parametri aggiornati al {formatDate(pensionParameters.dataAggiornamento)} (valori demo)</span>
        <span>
          Completezza dati: <strong className="text-foreground">{result.completezza.percentualeDatiUtente}%</strong>
        </span>
      </div>

      <section aria-labelledby="cards-title" className="space-y-4">
        <h2 id="cards-title" className="sr-only">
          Risultati principali
        </h2>
        <ResultCards result={result} base={Object.keys(overrides).length ? baseResult : undefined} />
      </section>

      {warnings.length > 0 && (
        <details className="rounded-xl border border-incerto/40 bg-incerto/5 p-4" open={warnings.length <= 3}>
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-incerto" aria-hidden /> Avvisi su dati e ipotesi ({warnings.length})
          </summary>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-8">
          <Card>
            <CardContent className="pt-5 sm:pt-6">
              <CombinedFutureChart result={result} reduceMotion={reduceMotion} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Il tuo reddito futuro, mese per mese</CardTitle>
              <CardDescription>
                Pensione pubblica stimata{base.personal.pensioneInvalidita ? ", pensione di invalidità" : ""}
                {result.etfAttivo ? ", integrazione ETF ipotetica" : ""} e confronto con il reddito che desideri.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.etfAttivo && <WithdrawalControls value={base.withdrawal} onChange={(w) => updateSection("withdrawal", w)} />}
              <SegmentedControl
                label="Valori"
                value={incomeReal ? "reale" : "nominale"}
                onChange={(v) => setIncomeReal(v === "reale")}
                options={[
                  { value: "reale", label: "In euro di oggi" },
                  { value: "nominale", label: "Nominali" },
                ]}
              />
              <RetirementIncomeChart
                reddito={result.reddito}
                real={incomeReal}
                showEtf={result.etfAttivo}
                showInvalidita={base.personal.pensioneInvalidita}
                reduceMotion={reduceMotion}
              />
              {result.etfAttivo && base.withdrawal.modalita === "nessuna" && (
                <p className="text-sm text-muted-foreground">
                  Hai scelto di non convertire il capitale: il grafico mostra solo la pensione. Capitale ETF centrale disponibile:{" "}
                  <strong>{formatEuro(result.etf.centrale.risultato?.capitaleFinale)}</strong>.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Modifica le ipotesi">
          <WhatIfPanel
            base={base}
            baseResult={baseResult}
            result={result}
            overrides={overrides}
            onChange={setOverrides}
            now={now}
            onApply={() => {
              replaceDraft({ ...effectiveInput, meta: { ...effectiveInput.meta } });
              setOverrides({});
            }}
          />
          <div className="flex flex-wrap gap-2">
            <SaveScenarioDialog input={effectiveInput} />
            <Button asChild variant="outline">
              <Link href="/report">
                <FileText aria-hidden /> Il mio futuro (stampabile)
              </Link>
            </Button>
          </div>
        </aside>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <DataCompletenessIndicator completeness={result.completezza} />
        <AssumptionCard assumptions={result.ipotesi} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>I tuoi dati</CardTitle>
          <CardDescription>Stampa il riepilogo, salva o importa la simulazione in formato JSON, oppure cancella tutto. I dati restano sul tuo dispositivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataActions input={effectiveInput} showPrint={false} />
          <p className="mt-3 text-xs text-muted-foreground">
            Per stampare, apri <Link className="underline" href="/report">Il mio futuro secondo i dati di oggi</Link>.
          </p>
        </CardContent>
      </Card>

      <DisclaimerBanner />
      <FinalMessage />
    </div>
  );
}

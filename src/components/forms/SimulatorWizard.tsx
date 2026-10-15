"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { Stepper, STEPS } from "./Stepper";
import { PersonalForm } from "./PersonalForm";
import { CareerForm } from "./CareerForm";
import { PensionForm } from "./PensionForm";
import { ETFForm } from "./ETFForm";
import { useSimulation } from "@/components/providers/SimulationProvider";
import { LoadingState } from "@/components/common/States";
import { DataLegend } from "@/components/layout/DataLegend";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  makeCareerSchema,
  makeContributionsSchema,
  makeEtfSchema,
  personalSchema,
} from "@/lib/validation/schemas";

/** Percorso guidato in cinque passaggi. Il passaggio 5 è la pagina dei risultati. */
export function SimulatorWizard() {
  const { hydrated, draft, loadDemo, replaceDraft } = useSimulation();
  const router = useRouter();
  const params = useSearchParams();
  const initialStep = Math.min(4, Math.max(1, Number(params.get("passo")) || 1));
  const [step, setStep] = React.useState(initialStep);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const firstRender = React.useRef(true);

  const completed = React.useMemo(() => {
    // Un passaggio è completato solo se lo sono anche tutti i precedenti.
    const ctx = { eta: draft.personal.eta, etaPensionamento: draft.personal.etaPensionamento, categoria: draft.personal.categoria };
    const checks = [
      () => personalSchema.safeParse(draft.personal).success,
      () => makeCareerSchema(ctx).safeParse(draft.career).success,
      () => makeContributionsSchema(ctx).safeParse(draft.contributions).success,
      () => makeEtfSchema(ctx).safeParse(draft.etf).success,
    ];
    const done: number[] = [];
    for (let i = 0; i < checks.length && checks[i](); i++) done.push(i + 1);
    if (done.length === 4) done.push(5);
    return done;
  }, [draft]);

  const goTo = React.useCallback(
    (s: number) => {
      if (s === 5) {
        router.push("/risultati");
        return;
      }
      setStep(s);
      const url = new URL(window.location.href);
      url.searchParams.set("passo", String(s));
      window.history.replaceState(null, "", url.toString());
    },
    [router],
  );

  // Porta il focus sul titolo del passaggio a ogni cambio (utile per tastiera e screen reader)
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, [step]);

  if (!hydrated) return <LoadingState />;

  const title = STEPS[step - 1].title;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataLegend className="flex-1" />
        <ConfirmDialog
          title="Caricare i dati dimostrativi?"
          description="I dati dimostrativi sono INVENTATI: non rappresentano una persona reale, una media italiana o un dato ufficiale. Sostituiranno i dati della simulazione corrente."
          confirmLabel="Carica dati demo"
          onConfirm={() => {
            loadDemo();
            router.push("/risultati");
          }}
          trigger={
            <Button variant="outline" size="sm">
              <FlaskConical aria-hidden /> Prova con dati dimostrativi
            </Button>
          }
        />
      </div>

      {draft.meta.isDemo && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-300/50 bg-amber-300/10 px-3 py-2 text-sm text-amber-100" role="status">
          <p className="flex-1">
            Stai usando <strong>dati dimostrativi inventati</strong>: non sono una media italiana né un dato ufficiale. Modificali con i tuoi.
          </p>
          <Button variant="outline" size="sm" onClick={() => replaceDraft({ ...draft, meta: { ...draft.meta, isDemo: false } })}>
            Ho inserito i miei dati
          </Button>
        </div>
      )}

      <Stepper current={step} completed={completed} onSelect={goTo} />

      <Card>
        <CardContent className="space-y-6 pt-6 sm:pt-8">
          <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
            <span className="text-muted-foreground">{step}.</span> {title}
          </h2>
          {step === 1 && <PersonalForm onNext={() => goTo(2)} />}
          {step === 2 && <CareerForm onNext={() => goTo(3)} onBack={() => goTo(1)} />}
          {step === 3 && <PensionForm onNext={() => goTo(4)} onBack={() => goTo(2)} />}
          {step === 4 && <ETFForm onNext={() => goTo(5)} onBack={() => goTo(3)} />}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">I campi con * sono necessari. I dati restano sul tuo dispositivo.</p>
      <DisclaimerBanner compact />
    </div>
  );
}

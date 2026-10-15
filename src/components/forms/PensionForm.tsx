"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller } from "react-hook-form";
import { Info } from "lucide-react";
import { makeContributionsSchema } from "@/lib/validation/schemas";
import { pensionParameters, getConfiguredRate } from "@/config/pensionParameters";
import { useSimulation, usePrefersReducedMotion } from "@/components/providers/SimulationProvider";
import { ControlledNumberField } from "./ControlledNumberField";
import { FormErrorSummary, StepNavigation } from "./StepNavigation";
import { useStepForm } from "./useStepForm";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { AutoValue } from "@/components/common/AutoValue";
import { PensionProjectionChart } from "@/components/charts/PensionProjectionChart";
import { runSimulation } from "@/lib/scenarios/calculateScenarios";
import { lookupCoefficient } from "@/lib/pension/calculatePension";
import { formatEuro, formatPercent } from "@/lib/format";
import { WORK_CATEGORY_LABELS } from "@/lib/types";

export const CONTRIBUTIVE_WARNING =
  "La stima segue il sistema contributivo. Posizioni miste, ricongiunzioni, riscatti, casse professionali o altre situazioni particolari richiedono verifiche specifiche.";

export function PensionForm({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { draft, validation } = useSimulation();
  const reduceMotion = usePrefersReducedMotion();
  const eta = draft.personal.eta;
  const resolver = React.useMemo(() => zodResolver(makeContributionsSchema({ eta })), [eta]);
  const { form, onInvalid, summary, setSummary } = useStepForm("contributions", resolver as never);
  const { control, handleSubmit } = form;

  const categoria = draft.personal.categoria ?? "non_so";
  const aliquota = getConfiguredRate(categoria);
  const etaPens = draft.personal.etaPensionamento;
  const coeff =
    etaPens !== undefined
      ? lookupCoefficient(
          Object.fromEntries(Object.entries(pensionParameters.coefficientiTrasformazione.valore).map(([k, v]) => [Number(k), v])),
          etaPens,
        )
      : null;

  const preview = React.useMemo(() => (validation.ok ? runSimulation(validation.data) : null), [validation]);

  const submit = handleSubmit(() => {
    setSummary([]);
    onNext();
  }, onInvalid);

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <p className="text-muted-foreground">Ci basta sapere da quanto tempo versi contributi. Il resto lo calcoliamo noi.</p>
      <FormErrorSummary errors={summary} />

      <div className="grid gap-5 sm:grid-cols-2">
        <ControlledNumberField
          control={control}
          name="anniContributi"
          label="Da quanti anni versi contributi?"
          category="certo"
          kind="integer"
          term="anniContributi"
          suffix="anni"
          required
          hint={categoria === "studente" ? "Se non hai mai lavorato con contratto, metti 0." : "Lo trovi nel tuo estratto conto contributivo INPS."}
        />
        <ControlledNumberField control={control} name="mesiContributi" label="Mesi in più" category="certo" kind="integer" suffix="mesi" required hint="Da 0 a 11." />
      </div>

      <Controller
        control={control}
        name="altreGestioni"
        render={({ field }) => (
          <CheckboxField
            id="campo-altreGestioni"
            label="Ho contributi anche in altre gestioni o casse previdenziali"
            description="Il simulatore non li somma: servirà una verifica specifica."
            checked={!!field.value}
            onChange={(e) => field.onChange(e.target.checked)}
          />
        )}
      />

      <section aria-labelledby="auto-contributi" className="space-y-3">
        <h3 id="auto-contributi" className="text-sm font-semibold text-muted-foreground">
          Calcolati automaticamente (non modificabili)
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <AutoValue
            label="Aliquota contributiva"
            value={formatPercent(aliquota)}
            category="regola"
            term="aliquota"
            origin={`in base alla categoria «${WORK_CATEGORY_LABELS[categoria]}»`}
            status={pensionParameters.aliquotePerCategoria[categoria].stato === "verificato" ? "verificato" : "demo"}
          />
          <AutoValue
            label="Contributi versati ogni anno"
            value={draft.career.stipendioAnnuo !== undefined ? formatEuro((draft.career.stipendioAnnuo * aliquota) / 100) : "—"}
            category="regola"
            origin={`stipendio lordo ${formatEuro(draft.career.stipendioAnnuo)} × aliquota`}
            status="stima"
          />
          <AutoValue
            label="Montante già accumulato"
            value={preview?.pensione.risultato ? formatEuro(preview.pensione.risultato.montanteIniziale) : "—"}
            category="certo"
            term="montante"
            origin="stimato dagli anni di contributi e dallo stipendio"
            status="stima"
          />
          <AutoValue
            label={`Coefficiente di trasformazione a ${etaPens ?? "—"} anni`}
            value={coeff ? formatPercent(coeff.valore, 3) : "—"}
            category="regola"
            term="coefficiente"
            origin="in base all'età di pensionamento scelta"
            status={pensionParameters.coefficientiTrasformazione.stato === "verificato" ? "verificato" : "demo"}
          />
          <AutoValue
            label="Rivalutazione annua del montante"
            value={formatPercent(pensionParameters.rivalutazioneDefault.valore)}
            category="incerto"
            term="rivalutazione"
            origin="tasso di riferimento configurato"
            status={pensionParameters.rivalutazioneDefault.stato === "verificato" ? "verificato" : "demo"}
          />
        </div>
      </section>

      <div className="flex gap-3 rounded-xl border border-incerto/30 bg-incerto/5 p-3 text-sm" role="note">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-incerto" aria-hidden />
        <p>{CONTRIBUTIVE_WARNING}</p>
      </div>

      {preview?.pensione.risultato && (
        <details className="rounded-xl border border-border bg-background/40 p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Anteprima: pensione lorda mensile stimata{" "}
            <strong className="tabular text-pension">{formatEuro(preview.pensione.risultato.pensioneMensileLorda)}</strong> a {etaPens} anni
          </summary>
          <div className="mt-4">
            <PensionProjectionChart rows={preview.pensione.dettaglio} reduceMotion={reduceMotion} />
          </div>
        </details>
      )}

      <StepNavigation onBack={onBack} />
    </form>
  );
}

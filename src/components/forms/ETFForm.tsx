"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller } from "react-hook-form";
import { AlertTriangle, PiggyBank } from "lucide-react";
import { makeEtfSchema } from "@/lib/validation/schemas";
import { AUTO_VALUES, SCENARIO_SPREAD } from "@/config/simulationDefaults";
import { getPlatform, investmentPlatforms, PLATFORM_SOURCE } from "@/config/investmentPlatforms";
import { useSimulation, usePrefersReducedMotion } from "@/components/providers/SimulationProvider";
import { ControlledNumberField } from "./ControlledNumberField";
import { FormErrorSummary, StepNavigation } from "./StepNavigation";
import { useStepForm } from "./useStepForm";
import { FormField } from "./FormField";
import { NativeSelect } from "@/components/ui/native-select";
import { AutoValue } from "@/components/common/AutoValue";
import { ETFProjectionChart } from "@/components/charts/ETFProjectionChart";
import { runSimulation } from "@/lib/scenarios/calculateScenarios";
import { formatDate, formatEuro, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const ETF_EXPLANATION =
  "Un ETF è uno strumento di investimento. Il capitale finale non è garantito e può essere inferiore ai versamenti effettuati.";

export function ETFForm({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { draft, validation } = useSimulation();
  const reduceMotion = usePrefersReducedMotion();
  const eta = draft.personal.eta;
  const etaPens = draft.personal.etaPensionamento;
  const resolver = React.useMemo(() => zodResolver(makeEtfSchema({ eta })), [eta]);
  const { form, onInvalid, summary, setSummary } = useStepForm("etf", resolver as never);
  const { control, handleSubmit, watch } = form;
  const attivo = watch("attivo");
  const piattaforma = watch("piattaforma");
  const allaPensione = watch("utilizzoAllaPensione");
  const platform = getPlatform(piattaforma);
  const preview = React.useMemo(() => (validation.ok && validation.data.etf.attivo ? runSimulation(validation.data) : null), [validation]);

  const submit = handleSubmit(() => {
    setSummary([]);
    onNext();
  }, onInvalid);

  const inflazione = (
    <AutoValue
      label="Inflazione annua"
      value={formatPercent(AUTO_VALUES.inflazione.valore)}
      category="incerto"
      term="inflazione"
      origin="obiettivo di medio periodo della BCE, usato per esprimere i valori futuri in euro di oggi —"
      status="verificato"
      source={AUTO_VALUES.inflazione.fonte}
    />
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Controller
        control={control}
        name="attivo"
        render={({ field }) => (
          <fieldset className="space-y-2">
            <legend className="flex items-center gap-2 text-base font-semibold">
              <PiggyBank className="h-5 w-5 text-etf" aria-hidden /> Vuoi simulare anche un investimento in ETF?
              <span className="text-sm font-normal text-muted-foreground">(facoltativo)</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
              {[
                { v: false, t: "No, solo la pensione pubblica", d: "Puoi aggiungerlo in qualsiasi momento." },
                { v: true, t: "Sì, voglio simulare un piano", d: "Un versamento mensile in ETF, come integrazione." },
              ].map((o) => (
                <label
                  key={String(o.v)}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl border p-3 text-sm focus-within:ring-2 focus-within:ring-ring",
                    field.value === o.v ? "border-primary bg-primary/10" : "border-border hover:bg-accent/40",
                  )}
                >
                  <input
                    type="radio"
                    id={o.v ? "campo-attivo" : undefined}
                    name={field.name}
                    className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                    checked={field.value === o.v}
                    onChange={() => field.onChange(o.v)}
                  />
                  <span>
                    <span className="block font-medium">{o.t}</span>
                    <span className="block text-xs text-muted-foreground">{o.d}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      />

      {!attivo ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Nei risultati vedrai solo la pensione pubblica stimata. I valori futuri saranno espressi anche in euro di oggi con:</p>
          {inflazione}
        </div>
      ) : (
        <>
          <div className="flex gap-3 rounded-xl border border-incerto/40 bg-incerto/10 p-4 text-sm" role="note">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-incerto" aria-hidden />
            <p className="font-semibold">{ETF_EXPLANATION}</p>
          </div>
          <FormErrorSummary errors={summary} />

          <Controller
            control={control}
            name="piattaforma"
            render={({ field, fieldState }) => (
              <FormField
                id="campo-piattaforma"
                label="Dove investiresti?"
                category="ipotesi"
                error={fieldState.error?.message}
                hint="Serve solo a stimare la commissione su ogni versamento. Non è un consiglio né una classifica."
              >
                {(a11y) => (
                  <NativeSelect {...a11y} name={field.name} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur}>
                    {investmentPlatforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </FormField>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <ControlledNumberField control={control} name="versamentoMensile" label="Quanto vuoi versare ogni mese?" category="ipotesi" kind="currency" term="versamentoMensile" required />
            <ControlledNumberField control={control} name="anni" label="Per quanti anni vuoi versare?" category="ipotesi" kind="integer" suffix="anni" required />
            <ControlledNumberField control={control} name="capitaleIniziale" label="Hai già dei soldi investiti? Quanto valgono oggi?" category="certo" kind="currency" term="capitaleIniziale" required hint="Metti 0 se parti da zero." />
            <ControlledNumberField control={control} name="incrementoVersamento" label="Vuoi aumentare il versamento ogni anno? Di quanto?" category="ipotesi" kind="percent" term="incrementoVersamento" required hint="Metti 0 se versi sempre la stessa cifra." />
          </div>

          <Controller
            control={control}
            name="utilizzoAllaPensione"
            render={({ field }) => (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Quando vuoi iniziare a usare i soldi investiti?</legend>
                <p className="text-xs text-muted-foreground">Da quel momento smetti di versare e inizi a prelevare una parte del capitale ogni mese.</p>
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
                  {[
                    { v: true, t: `Quando vado in pensione${etaPens ? ` (a ${etaPens} anni)` : ""}`, d: "La scelta più comune." },
                    { v: false, t: "A un'altra età", d: "Prima o dopo la pensione." },
                  ].map((o) => (
                    <label
                      key={String(o.v)}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-xl border p-3 text-sm focus-within:ring-2 focus-within:ring-ring",
                        field.value === o.v ? "border-primary bg-primary/10" : "border-border hover:bg-accent/40",
                      )}
                    >
                      <input
                        type="radio"
                        name={field.name}
                        className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                        checked={field.value === o.v}
                        onChange={() => field.onChange(o.v)}
                      />
                      <span>
                        <span className="block font-medium">{o.t}</span>
                        <span className="block text-xs text-muted-foreground">{o.d}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          />
          {!allaPensione && (
            <ControlledNumberField control={control} name="etaUtilizzo" label="A che età?" category="ipotesi" kind="integer" suffix="anni" required />
          )}

          <ControlledNumberField
            control={control}
            name="versamentiEffettuati"
            label="Quanto hai versato in totale finora? (facoltativo)"
            category="certo"
            kind="currency"
            term="versamentiEffettuati"
            hint="Solo come riferimento: non cambia il calcolo."
          />

          <section aria-labelledby="auto-etf" className="space-y-3">
            <h3 id="auto-etf" className="text-sm font-semibold text-muted-foreground">
              Calcolati automaticamente (non modificabili)
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <AutoValue
                label="Commissione per ogni versamento"
                value={formatEuro(platform.commissionePAC, true)}
                category={platform.affidabilita === "stima" ? "ipotesi" : "regola"}
                term="commissione"
                origin={
                  platform.affidabilita === "stima"
                    ? `${platform.nota ?? "stima"}`
                    : `${platform.nome}, PAC in ETF, dati al ${formatDate(PLATFORM_SOURCE.datiAggiornatiAl)}${platform.nota ? `. ${platform.nota}` : ""} —`
                }
                status={platform.affidabilita === "stima" ? "stima" : "verificato"}
                source={platform.affidabilita === "stima" ? undefined : { nome: "justETF", url: PLATFORM_SOURCE.url }}
              />
              <AutoValue
                label="Costo annuo dello strumento"
                value={formatPercent(AUTO_VALUES.costoAnnuoETF.valore)}
                category="ipotesi"
                term="costoAnnuo"
                origin="costo tipico di un ETF globale a replica di indice (dipende dall'ETF, non dalla banca)"
                status="demo"
              />
              <AutoValue
                label="Rendimento annuo lordo ipotizzato"
                value={formatPercent(AUTO_VALUES.rendimentoETF.valore)}
                category="incerto"
                term="rendimento"
                origin={`valore didattico per lo scenario centrale; prudente ${formatPercent(AUTO_VALUES.rendimentoETF.valore + SCENARIO_SPREAD.prudente)}, favorevole ${formatPercent(AUTO_VALUES.rendimentoETF.valore + SCENARIO_SPREAD.favorevole)}. Non è una previsione`}
                status="demo"
              />
              {inflazione}
            </div>
          </section>

          {preview?.etf.centrale.risultato && (
            <details className="rounded-xl border border-border bg-background/40 p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Anteprima a {preview.valoriAutomatici.etaUtilizzo} anni: tra{" "}
                <strong className="tabular text-etf">{formatEuro(preview.etf.prudente.risultato?.capitaleFinale)}</strong> e{" "}
                <strong className="tabular text-etf">{formatEuro(preview.etf.favorevole.risultato?.capitaleFinale)}</strong>, a fronte di{" "}
                {formatEuro(preview.etf.centrale.risultato.totaleInvestito)} investiti (prima delle tasse)
              </summary>
              <div className="mt-4">
                <ETFProjectionChart scenarios={preview.etf} reduceMotion={reduceMotion} />
              </div>
            </details>
          )}
        </>
      )}

      <StepNavigation onBack={onBack} nextLabel="Scopri il tuo futuro" />
    </form>
  );
}

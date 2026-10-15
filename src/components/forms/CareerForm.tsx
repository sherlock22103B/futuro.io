"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller } from "react-hook-form";
import { Info } from "lucide-react";
import { makeCareerSchema } from "@/lib/validation/schemas";
import { HYPOTHESIS_DEFAULTS } from "@/config/simulationDefaults";
import { useSimulation } from "@/components/providers/SimulationProvider";
import { ControlledNumberField } from "./ControlledNumberField";
import { FormErrorSummary, StepNavigation } from "./StepNavigation";
import { useStepForm } from "./useStepForm";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { AutoValue } from "@/components/common/AutoValue";
import { formatEuro, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CareerForm({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { draft } = useSimulation();
  const eta = draft.personal.eta;
  const etaPens = draft.personal.etaPensionamento;
  const categoria = draft.personal.categoria;
  const studente = categoria === "studente";
  const resolver = React.useMemo(
    () => zodResolver(makeCareerSchema({ eta, etaPensionamento: etaPens, categoria })),
    [eta, etaPens, categoria],
  );
  const { form, onInvalid, summary, setSummary } = useStepForm("career", resolver as never);
  const { control, handleSubmit, setValue, watch, getValues } = form;

  const modalita = watch("modalitaStipendio");
  const mensile = watch("stipendioMensile");
  const mensilita = watch("mensilita");
  const annuo = watch("stipendioAnnuo");
  const sconosciuta = watch("crescitaSconosciuta");
  const etaInizio = watch("etaInizioLavoro");
  const anniAllaPensione = eta !== undefined && etaPens !== undefined ? etaPens - eta : undefined;
  const anniLavoroStudente = etaPens !== undefined && etaInizio !== undefined ? Math.max(0, etaPens - etaInizio) : undefined;

  // Valori predefiniti: chi lavora lavora fino alla pensione; chi studia non ha ancora anni lavorati.
  React.useEffect(() => {
    if (studente) {
      setValue("anniLavorati", 0);
      if (anniLavoroStudente !== undefined) setValue("anniFuturi", anniLavoroStudente);
    } else if (getValues("anniFuturi") === undefined && anniAllaPensione !== undefined && anniAllaPensione > 0) {
      setValue("anniFuturi", anniAllaPensione);
    }
  }, [studente, anniAllaPensione, anniLavoroStudente, getValues, setValue]);

  // Stipendio mensile → annuale
  React.useEffect(() => {
    if (modalita === "mensile" && mensile !== undefined && mensilita !== undefined) {
      setValue("stipendioAnnuo", Math.round(mensile * mensilita * 100) / 100, { shouldValidate: form.formState.isSubmitted });
    }
  }, [modalita, mensile, mensilita, setValue, form.formState.isSubmitted]);

  const submit = handleSubmit(() => {
    setSummary([]);
    onNext();
  }, onInvalid);

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <p className="text-muted-foreground">
        {studente
          ? "Ancora non lavori: indica quando pensi di iniziare e quanto prevedi di guadagnare all'inizio."
          : "Lo stipendio lordo è la base su cui si calcolano i contributi per la pensione."}
      </p>
      <FormErrorSummary errors={summary} />

      {studente && (
        <ControlledNumberField
          control={control}
          name="etaInizioLavoro"
          label="A che età pensi di iniziare a lavorare?"
          category="ipotesi"
          kind="integer"
          suffix="anni"
          required
          hint="Fino a quell'età non verranno conteggiati contributi."
        />
      )}

      <Controller
        control={control}
        name="modalitaStipendio"
        render={({ field }) => (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Come preferisci indicare lo stipendio?</legend>
            <div className="inline-flex rounded-xl bg-secondary/70 p-1" role="radiogroup">
              {(["annuo", "mensile"] as const).map((v) => (
                <label
                  key={v}
                  className={cn(
                    "flex min-h-10 cursor-pointer items-center rounded-lg px-4 text-sm font-medium focus-within:ring-2 focus-within:ring-ring",
                    field.value === v ? "bg-background text-foreground shadow" : "text-muted-foreground",
                  )}
                >
                  <input type="radio" className="sr-only" name={field.name} value={v} checked={field.value === v} onChange={() => field.onChange(v)} />
                  {v === "annuo" ? "Lordo annuo" : "Lordo mensile"}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {modalita === "mensile" ? (
          <ControlledNumberField
            control={control}
            name="stipendioMensile"
            label={studente ? "Stipendio lordo mensile che prevedi all'inizio" : "Stipendio lordo mensile"}
            category={studente ? "ipotesi" : "certo"}
            kind="currency"
            term="stipendioLordo"
            required
            hint={annuo !== undefined ? `Annuo calcolato: ${formatEuro(annuo)}` : undefined}
          />
        ) : (
          <ControlledNumberField
            control={control}
            name="stipendioAnnuo"
            label={studente ? "Stipendio lordo annuo che prevedi all'inizio" : "Stipendio lordo annuo"}
            category={studente ? "ipotesi" : "certo"}
            kind="currency"
            term="stipendioLordo"
            required
            hint={studente ? "In euro di oggi. Se non lo sai, pensa a un primo impiego nel settore che ti interessa." : undefined}
          />
        )}
        <ControlledNumberField control={control} name="mensilita" label="Quante mensilità ricevi (o riceverai)?" category="certo" kind="integer" term="mensilita" required />
      </div>

      <div className="flex gap-3 rounded-xl border border-regola/30 bg-regola/5 p-3 text-sm" role="note">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-regola" aria-hidden />
        <p>Lo stipendio netto non è sufficiente per una stima previdenziale. Se possibile, inserisci la retribuzione lorda o imponibile.</p>
      </div>

      {studente ? (
        <AutoValue
          label="Anni di lavoro fino alla pensione"
          value={anniLavoroStudente !== undefined ? `${anniLavoroStudente} anni` : "—"}
          category="ipotesi"
          origin={`dall'età di inizio lavoro all'età di pensionamento (${etaPens ?? "—"} anni)`}
          status="stima"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <ControlledNumberField control={control} name="anniLavorati" label="Da quanti anni lavori?" category="certo" kind="integer" term="anniLavorati" suffix="anni" required />
          <ControlledNumberField
            control={control}
            name="anniFuturi"
            label="Quanti anni pensi di lavorare ancora?"
            category="ipotesi"
            kind="integer"
            term="anniFuturi"
            suffix="anni"
            required
            hint={anniAllaPensione !== undefined ? `Alla pensione mancano ${anniAllaPensione} anni.` : undefined}
          />
        </div>
      )}

      <div className="space-y-2 rounded-xl border border-ipotesi/30 bg-ipotesi/5 p-4">
        <ControlledNumberField
          control={control}
          name="crescitaStipendio"
          label="Di quanto crescerà il tuo stipendio ogni anno?"
          category="ipotesi"
          kind="percent"
          term="crescitaStipendio"
          required
          hint="Crescita media nominale annua. Questo valore può cambiare."
          onValueChange={(v) => {
            if (v !== HYPOTHESIS_DEFAULTS.crescitaStipendio) setValue("crescitaSconosciuta", false);
          }}
        />
        <Controller
          control={control}
          name="crescitaSconosciuta"
          render={({ field }) => (
            <CheckboxField
              id="campo-crescitaSconosciuta"
              label="Non conosco la crescita futura dello stipendio"
              description={`Useremo un valore predefinito del ${formatPercent(HYPOTHESIS_DEFAULTS.crescitaStipendio)} annuo, segnalato come ipotesi.`}
              checked={!!field.value}
              onChange={(e) => {
                field.onChange(e.target.checked);
                if (e.target.checked) setValue("crescitaStipendio", HYPOTHESIS_DEFAULTS.crescitaStipendio);
              }}
            />
          )}
        />
        {sconosciuta && <p className="text-xs text-ipotesi">Stai usando il valore predefinito: è un&apos;ipotesi, non un dato.</p>}
      </div>

      <StepNavigation onBack={onBack} />
    </form>
  );
}

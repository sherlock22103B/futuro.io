"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller } from "react-hook-form";
import { HelpCircle } from "lucide-react";
import { personalSchema } from "@/lib/validation/schemas";
import { pensionParameters, DEMO_LABEL } from "@/config/pensionParameters";
import { WORK_CATEGORY_LABELS, WORK_CATEGORY_VALUES } from "@/lib/types";
import { ControlledNumberField } from "./ControlledNumberField";
import { FormErrorSummary, StepNavigation } from "./StepNavigation";
import { useStepForm } from "./useStepForm";
import { DataCategoryBadge } from "@/components/common/DataCategoryBadge";
import { SourceTooltip } from "@/components/common/SourceTooltip";
import { formatPercent } from "@/lib/format";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { cn } from "@/lib/utils";

export function PersonalForm({ onNext }: { onNext: () => void }) {
  const { form, onInvalid, summary, setSummary } = useStepForm(
    "personal",
    zodResolver(personalSchema) as never,
  );
  const { control, handleSubmit, setValue, watch, formState } = form;
  const annoManuale = React.useRef(false);
  const categoria = watch("categoria");
  const invalidita = watch("pensioneInvalidita");
  const currentYear = new Date().getFullYear();

  const submit = handleSubmit(() => {
    setSummary([]);
    onNext();
  }, onInvalid);

  return (
    <form onSubmit={submit} noValidate className="space-y-6" aria-describedby="step-desc">
      <p id="step-desc" className="text-muted-foreground">
        Partiamo dalle basi. Servono solo età, lavoro e obiettivi: nessun nome, codice fiscale o documento.
      </p>
      <FormErrorSummary errors={summary} />

      <div className="grid gap-5 sm:grid-cols-2">
        <ControlledNumberField
          control={control}
          name="eta"
          label="Quanti anni hai?"
          category="certo"
          kind="integer"
          term="eta"
          suffix="anni"
          required
          onValueChange={(v) => {
            if (v !== undefined && !annoManuale.current) {
              setValue("annoNascita", currentYear - v, { shouldDirty: true });
            }
          }}
        />
        <ControlledNumberField
          control={control}
          name="annoNascita"
          label="Anno di nascita"
          category="certo"
          kind="integer"
          term="annoNascita"
          hint="Calcolato in automatico dall'età: puoi correggerlo."
          required
          onValueChange={() => {
            annoManuale.current = true;
          }}
        />
      </div>

      <Controller
        control={control}
        name="categoria"
        render={({ field, fieldState }) => (
          <fieldset className="space-y-2" aria-describedby={fieldState.error ? "campo-categoria-error" : undefined}>
            <legend className="flex w-full flex-wrap items-center gap-2 text-sm font-medium">
              Che lavoro fai?
              <SourceTooltip term="categoria" />
              <DataCategoryBadge category="certo" compact className="ml-auto" />
            </legend>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
              {WORK_CATEGORY_VALUES.map((value, i) => {
                const checked = field.value === value;
                return (
                  <label
                    key={value}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-ring",
                      checked ? "border-primary bg-primary/10" : "border-border hover:bg-accent/50",
                    )}
                  >
                    <input
                      type="radio"
                      id={i === 0 ? "campo-categoria" : undefined}
                      name={field.name}
                      value={value}
                      checked={checked}
                      onChange={() => field.onChange(value)}
                      onBlur={field.onBlur}
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                    />
                    <span>{WORK_CATEGORY_LABELS[value]}</span>
                  </label>
                );
              })}
            </div>
            {fieldState.error && (
              <p id="campo-categoria-error" role="alert" className="text-sm font-medium text-red-300">
                {fieldState.error.message}
              </p>
            )}
          </fieldset>
        )}
      />

      {categoria === "studente" && (
        <div className="flex gap-3 rounded-xl border border-ipotesi/40 bg-ipotesi/10 p-4 text-sm" role="note">
          <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-ipotesi" aria-hidden />
          <p className="text-slate-200">
            Nel prossimo passaggio ti chiederemo a che età pensi di iniziare a lavorare e quanto prevedi di guadagnare all&apos;inizio. Fino ad allora non
            ci sono contributi.
          </p>
        </div>
      )}

      {categoria === "non_so" && (
        <div className="flex gap-3 rounded-xl border border-incerto/40 bg-incerto/10 p-4 text-sm" role="note">
          <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-incerto" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold">Nessun problema, puoi continuare.</p>
            <p className="text-slate-200">
              La categoria serve a scegliere l&apos;aliquota con cui si accumulano i contributi. Trovi la tua gestione
              sull&apos;estratto conto contributivo INPS. Intanto useremo un parametro dimostrativo del{" "}
              {formatPercent(pensionParameters.aliquotePerCategoria.non_so.valore)}: <strong>{DEMO_LABEL}</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <ControlledNumberField
          control={control}
          name="etaPensionamento"
          label="A che età vorresti andare in pensione?"
          category="ipotesi"
          kind="integer"
          term="etaPensionamento"
          suffix="anni"
          required
          hint={`Età di riferimento configurata: ${pensionParameters.etaPensionabile.valore} anni (${pensionParameters.etaPensionabile.stato === "demo" ? "valore demo" : "verificato"}).`}
        />
        <ControlledNumberField
          control={control}
          name="redditoDesiderato"
          label="Quanto vorresti avere al mese in pensione?"
          category="ipotesi"
          kind="currency"
          term="redditoDesiderato"
          required
          hint="In euro di oggi, al lordo delle tasse."
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <Controller
          control={control}
          name="pensioneInvalidita"
          render={({ field }) => (
            <CheckboxField
              id="campo-pensioneInvalidita"
              label="Ricevo (o so che riceverò) una pensione di invalidità"
              description="Facoltativo. Se la percepisci, la sommiamo al tuo reddito futuro così come la indichi: il simulatore non la calcola."
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        {invalidita && (
          <ControlledNumberField
            control={control}
            name="importoInvalidita"
            label="Importo mensile della pensione di invalidità"
            category="certo"
            kind="currency"
            term="invalidita"
            required
            hint="Lordo, come risulta dal tuo cedolino o dalla comunicazione dell'ente previdenziale."
          />
        )}
      </div>

      {formState.isSubmitted && summary.length === 0 && <span className="sr-only" role="status">Dati salvati.</span>}
      <StepNavigation />
    </form>
  );
}

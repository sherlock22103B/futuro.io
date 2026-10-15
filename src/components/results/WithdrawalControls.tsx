"use client";

import * as React from "react";
import type { WithdrawalData } from "@/lib/validation/schemas";
import { withdrawalSchema } from "@/lib/validation/schemas";
import { NumberInput, PercentageInput } from "@/components/forms/NumberInput";
import { FormField } from "@/components/forms/FormField";
import { AutoValue } from "@/components/common/AutoValue";
import { AUTO_VALUES } from "@/config/simulationDefaults";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const OPTIONS: { value: WithdrawalData["modalita"]; label: string; description: string }[] = [
  { value: "anni", label: "Prelievo per un numero di anni", description: "Il capitale viene consumato in rate mensili costanti." },
  { value: "percentuale", label: "Percentuale annua", description: "Ogni anno prelevi una quota fissa del capitale iniziale." },
  { value: "nessuna", label: "Nessuna conversione", description: "Mostra solo il capitale, senza trasformarlo in reddito." },
];

/** Scelta dell'ipotesi con cui il capitale ETF viene usato in pensione. */
export function WithdrawalControls({ value, onChange }: { value: WithdrawalData; onChange: (v: WithdrawalData) => void }) {
  const [local, setLocal] = React.useState<Partial<WithdrawalData>>(value);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => setLocal(value), [value]);

  const update = (patch: Partial<WithdrawalData>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    const res = withdrawalSchema.safeParse(next);
    if (res.success) {
      setErrors({});
      onChange(res.data);
    } else {
      const e: Record<string, string> = {};
      for (const i of res.error.issues) e[String(i.path[0])] = i.message;
      setErrors(e);
    }
  };

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Come vuoi usare il capitale ETF in pensione?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {OPTIONS.map((o) => (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border p-3 text-sm focus-within:ring-2 focus-within:ring-ring",
                local.modalita === o.value ? "border-primary bg-primary/10" : "border-border hover:bg-accent/40",
              )}
            >
              <input
                type="radio"
                name="modalita-prelievo"
                className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                checked={local.modalita === o.value}
                onChange={() => update({ modalita: o.value })}
              />
              <span>
                <span className="block font-medium">{o.label}</span>
                <span className="block text-xs text-muted-foreground">{o.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {local.modalita !== "nessuna" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {local.modalita === "anni" ? (
            <FormField id="prelievo-anni" label="Per quanti anni vuoi usare il capitale?" category="ipotesi" error={errors.anni}>
              {(a11y) => <NumberInput {...a11y} integer suffix="anni" value={local.anni} onValueChange={(v) => update({ anni: v })} />}
            </FormField>
          ) : (
            <FormField id="prelievo-perc" label="Percentuale annua di prelievo" category="ipotesi" error={errors.percentuale}>
              {(a11y) => <PercentageInput {...a11y} value={local.percentuale} onValueChange={(v) => update({ percentuale: v })} />}
            </FormField>
          )}
          <AutoValue
            label="Rendimento durante il prelievo"
            value={`${formatPercent(AUTO_VALUES.rendimentoPrelievo.valore)} oltre l'inflazione`}
            category="incerto"
            origin="ipotesi prudente: il capitale residuo cresce solo quanto il costo della vita"
            status="demo"
          />
        </div>
      )}
      <p className="rounded-lg border border-incerto/30 bg-incerto/5 p-3 text-sm">
        L&apos;integrazione ETF è una simulazione di prelievo e non una rendita garantita.
      </p>
    </div>
  );
}

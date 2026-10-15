"use client";

import * as React from "react";
import { useForm, type DefaultValues, type FieldErrors, type FieldValues, type Resolver } from "react-hook-form";
import { useSimulation } from "@/components/providers/SimulationProvider";
import type { SimulationInput, SimulationSection } from "@/lib/validation/schemas";

/**
 * Hook comune ai passaggi del simulatore:
 * - inizializza il form dalla bozza salvata;
 * - salva automaticamente ogni modifica nella bozza (così tornando indietro nulla si perde);
 * - valida con Zod e restituisce l'elenco errori per il riepilogo accessibile.
 */
export function useStepForm<K extends SimulationSection>(section: K, resolver: Resolver<SimulationInput[K] & FieldValues>) {
  type V = SimulationInput[K] & FieldValues;
  const { draft, updateSection } = useSimulation();
  const form = useForm<V>({
    resolver,
    defaultValues: draft[section] as DefaultValues<V>,
    mode: "onTouched",
  });

  React.useEffect(() => {
    const sub = form.watch((values) => {
      updateSection(section, values as Partial<SimulationInput[K]>);
    });
    return () => sub.unsubscribe();
  }, [form, section, updateSection]);

  const [summary, setSummary] = React.useState<{ id: string; message: string }[]>([]);

  const onInvalid = React.useCallback((errors: FieldErrors<V>) => {
    const list: { id: string; message: string }[] = [];
    for (const [name, err] of Object.entries(errors)) {
      const message = (err as { message?: string } | undefined)?.message;
      if (message) list.push({ id: `campo-${name}`, message });
    }
    setSummary(list);
    const first = list[0];
    if (first) requestAnimationFrame(() => document.getElementById(first.id)?.focus());
  }, []);

  const save = React.useCallback(() => {
    updateSection(section, form.getValues() as Partial<SimulationInput[K]>);
  }, [form, section, updateSection]);

  return { form, onInvalid, summary, setSummary, save };
}

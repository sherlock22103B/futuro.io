"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StepNavigation({
  onBack,
  nextLabel = "Continua",
  backLabel = "Indietro",
}: {
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
      {onBack ? (
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft aria-hidden /> {backLabel}
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit" size="lg">
        {nextLabel} <ArrowRight aria-hidden />
      </Button>
    </div>
  );
}

/** Riepilogo errori del form: porta il focus al primo campo non valido. */
export function FormErrorSummary({ errors }: { errors: { id: string; message: string }[] }) {
  if (errors.length === 0) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-400/50 bg-red-500/10 p-4 text-sm">
      <p className="font-semibold">Controlla {errors.length === 1 ? "questo campo" : `questi ${errors.length} campi`}:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {errors.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              className="underline underline-offset-4"
              onClick={(ev) => {
                ev.preventDefault();
                document.getElementById(e.id)?.focus();
              }}
            >
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

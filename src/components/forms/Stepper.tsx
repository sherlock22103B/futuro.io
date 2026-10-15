"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const STEPS = [
  { id: 1, title: "Chi sei" },
  { id: 2, title: "La tua carriera" },
  { id: 3, title: "I tuoi contributi" },
  { id: 4, title: "Il tuo piano ETF" },
  { id: 5, title: "Il tuo futuro" },
] as const;

interface StepperProps {
  current: number;
  /** Passaggi già validi (cliccabili). */
  completed: number[];
  onSelect: (step: number) => void;
}

/** Barra di avanzamento a cinque passaggi, navigabile da tastiera. */
export function Stepper({ current, completed, onSelect }: StepperProps) {
  const progress = ((current - 1) / (STEPS.length - 1)) * 100;
  return (
    <nav aria-label="Avanzamento della simulazione" className="space-y-3">
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={current}
        aria-valuetext={`Passaggio ${current} di ${STEPS.length}: ${STEPS[current - 1]?.title}`}
      >
        <div className="h-full rounded-full bg-gradient-to-r from-pension to-etf transition-all" style={{ width: `${progress}%` }} />
      </div>
      <ol className="grid grid-cols-5 gap-1">
        {STEPS.map((s) => {
          const isCurrent = s.id === current;
          const isDone = completed.includes(s.id) && !isCurrent;
          const reachable = isDone || isCurrent || completed.includes(s.id - 1) || s.id === 1;
          return (
            <li key={s.id} className="min-w-0">
              <button
                type="button"
                onClick={() => reachable && onSelect(s.id)}
                disabled={!reachable}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-lg p-1 text-center transition-colors disabled:cursor-not-allowed",
                  reachable && !isCurrent && "hover:bg-accent",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    isDone && "border-certo bg-certo/15 text-certo",
                    !isCurrent && !isDone && "border-border text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {isDone ? <Check className="h-4 w-4" /> : s.id}
                </span>
                <span className={cn("hidden text-xs font-medium sm:block", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                  {s.title}
                </span>
                <span className="sr-only">
                  Passaggio {s.id}: {s.title}
                  {isDone ? " (completato)" : ""}
                  {isCurrent ? " (attuale)" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="text-center text-sm font-semibold sm:hidden" aria-hidden>
        {current}. {STEPS[current - 1]?.title}
      </p>
    </nav>
  );
}

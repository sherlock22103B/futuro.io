"use client";

import * as React from "react";
import Link from "next/link";
import { BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSimulation } from "@/components/providers/SimulationProvider";
import { MAX_SAVED_SCENARIOS, SCENARIO_NAME_PRESETS } from "@/config/simulationDefaults";
import type { SimulationInput } from "@/lib/validation/schemas";

/** Salva la simulazione (eventualmente modificata con gli slider) come scenario nel browser. */
export function SaveScenarioDialog({ input }: { input: SimulationInput }) {
  const { scenarios, saveScenario, activeScenarioId, updateScenario } = useSimulation();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [saved, setSaved] = React.useState<string | null>(null);
  const active = scenarios.find((s) => s.id === activeScenarioId);
  const full = scenarios.length >= MAX_SAVED_SCENARIOS;
  const suggested = SCENARIO_NAME_PRESETS.find((p) => !scenarios.some((s) => s.nome === p)) ?? `Scenario ${scenarios.length + 1}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setName(suggested);
          setSaved(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <BookmarkPlus aria-hidden /> Salva scenario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salva questo scenario</DialogTitle>
          <DialogDescription>
            Puoi salvare fino a {MAX_SAVED_SCENARIOS} scenari in questo browser e confrontarli. Gli scenari restano sul tuo dispositivo.
          </DialogDescription>
        </DialogHeader>
        {saved ? (
          <p role="status" className="rounded-lg border border-certo/40 bg-certo/10 p-3 text-sm">
            Scenario «{saved}» salvato.{" "}
            <Link href="/confronta" className="font-semibold underline underline-offset-4">
              Vai al confronto
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {active && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  updateScenario(active.id, { input });
                  setSaved(active.nome);
                }}
              >
                Aggiorna lo scenario «{active.nome}»
              </Button>
            )}
            {full ? (
              <p className="text-sm text-incerto">
                Hai già {MAX_SAVED_SCENARIOS} scenari salvati. Eliminane uno dalla pagina{" "}
                <Link href="/confronta" className="underline">Confronta scenari</Link> per salvarne uno nuovo.
              </p>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const s = saveScenario(name, input);
                  if (s) setSaved(s.nome);
                }}
              >
                <label htmlFor="nome-scenario" className="text-sm font-medium">
                  Nome dello scenario
                </label>
                <Input id="nome-scenario" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} required />
                <div className="flex flex-wrap gap-2" aria-label="Nomi suggeriti">
                  {SCENARIO_NAME_PRESETS.map((p) => (
                    <Button key={p} type="button" size="sm" variant="ghost" onClick={() => setName(p)}>
                      {p}
                    </Button>
                  ))}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Annulla
                  </Button>
                  <Button type="submit" disabled={!name.trim()}>
                    Salva come nuovo scenario
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

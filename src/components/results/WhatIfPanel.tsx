"use client";

import * as React from "react";
import { RotateCcw, Save } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataCategoryBadge } from "@/components/common/DataCategoryBadge";
import {
  applyWhatIf,
  runSimulation,
  type SimulationResult,
  type WhatIfOverrides,
} from "@/lib/scenarios/calculateScenarios";
import type { SimulationInput } from "@/lib/validation/schemas";
import { SIMULATION_LIMITS } from "@/config/simulationDefaults";
import { formatEuro, formatEuroDelta, formatPercent } from "@/lib/format";
import type { DataCategory } from "@/lib/types";

interface WhatIfPanelProps {
  base: SimulationInput;
  baseResult: SimulationResult;
  result: SimulationResult;
  overrides: WhatIfOverrides;
  onChange: (o: WhatIfOverrides) => void;
  onApply: () => void;
  now: Date;
}

function SliderRow({
  id,
  label,
  category,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: string;
  category: DataCategory;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span id={`${id}-label`} className="text-sm font-medium">
          {label}
        </span>
        <span className="flex items-center gap-2">
          <output htmlFor={id} className="text-base font-bold tabular" aria-live="off">
            {display}
          </output>
          <DataCategoryBadge category={category} compact />
        </span>
      </div>
      <Slider
        id={id}
        aria-labelledby={`${id}-label`}
        thumbLabel={label}
        valueText={display}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
      <div className="flex justify-between text-[11px] text-muted-foreground" aria-hidden>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

/** "Come cambia il tuo futuro?": quattro slider che ricalcolano tutto in tempo reale. */
export function WhatIfPanel({ base, baseResult, result, overrides, onChange, onApply, now }: WhatIfPanelProps) {
  const eta = base.personal.eta;
  const current = {
    etaPensionamento: overrides.etaPensionamento ?? base.personal.etaPensionamento,
    versamentoMensile: overrides.versamentoMensile ?? base.etf.versamentoMensile,
    crescitaStipendio: overrides.crescitaStipendio ?? base.career.crescitaStipendio,
  };

  const versMax = Math.max(1000, Math.ceil((base.etf.versamentoMensile * 3) / 100) * 100);
  const changed = Object.keys(overrides).length > 0;

  // Effetto di ciascuna modifica presa da sola, calcolato realmente sui dati
  const messages = React.useMemo(() => {
    const out: string[] = [];
    const single = (o: WhatIfOverrides) => runSimulation(applyWhatIf(base, o), undefined, now);
    if (overrides.versamentoMensile !== undefined && overrides.versamentoMensile !== base.etf.versamentoMensile) {
      const r = single({ versamentoMensile: overrides.versamentoMensile });
      const diff = overrides.versamentoMensile - base.etf.versamentoMensile;
      const delta = (r.etf.centrale.risultato?.capitaleFinale ?? 0) - (baseResult.etf.centrale.risultato?.capitaleFinale ?? 0);
      out.push(
        `Con ${formatEuro(Math.abs(diff))} ${diff > 0 ? "in più" : "in meno"} al mese, nello scenario centrale il capitale simulato cambia di ${formatEuroDelta(delta)}.`,
      );
    }
    if (overrides.etaPensionamento !== undefined && overrides.etaPensionamento !== base.personal.etaPensionamento) {
      const r = single({ etaPensionamento: overrides.etaPensionamento });
      const delta = (r.pensione.risultato?.pensioneMensileLorda ?? 0) - (baseResult.pensione.risultato?.pensioneMensileLorda ?? 0);
      const deltaReal = (r.pensione.risultato?.pensioneMensileLordaReale ?? 0) - (baseResult.pensione.risultato?.pensioneMensileLordaReale ?? 0);
      out.push(
        `Andando in pensione a ${overrides.etaPensionamento} anni invece che a ${base.personal.etaPensionamento}, la pensione lorda mensile stimata cambia di ${formatEuroDelta(delta)} (${formatEuroDelta(deltaReal)} in euro di oggi).`,
      );
    }
    if (overrides.crescitaStipendio !== undefined && overrides.crescitaStipendio !== base.career.crescitaStipendio) {
      const r = single({ crescitaStipendio: overrides.crescitaStipendio });
      const delta = (r.pensione.risultato?.pensioneMensileLorda ?? 0) - (baseResult.pensione.risultato?.pensioneMensileLorda ?? 0);
      out.push(
        `Con una crescita dello stipendio del ${formatPercent(overrides.crescitaStipendio)} invece del ${formatPercent(base.career.crescitaStipendio)}, la pensione lorda mensile stimata cambia di ${formatEuroDelta(delta)}.`,
      );
    }
    return out;
  }, [overrides, base, baseResult, now]);

  const set = (key: keyof WhatIfOverrides, original: number) => (v: number) => {
    const next = { ...overrides };
    if (Math.abs(v - original) < 1e-9) delete next[key];
    else next[key] = v;
    onChange(next);
  };

  return (
    <Card className="border-ipotesi/40">
      <CardHeader>
        <CardTitle className="text-xl">Come cambia il tuo futuro?</CardTitle>
        <CardDescription>Sposta gli slider: card e grafici si aggiornano subito. I tuoi dati salvati non cambiano finché non scegli «Applica».</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <SliderRow
          id="wi-eta"
          label="Età di pensionamento"
          category="ipotesi"
          value={current.etaPensionamento}
          min={eta + 1}
          max={SIMULATION_LIMITS.etaPensionamentoMax}
          step={1}
          display={`${current.etaPensionamento} anni`}
          onChange={set("etaPensionamento", base.personal.etaPensionamento)}
        />
        {base.etf.attivo && (
          <SliderRow
            id="wi-vers"
            label="Versamento ETF mensile"
            category="ipotesi"
            value={current.versamentoMensile}
            min={0}
            max={versMax}
            step={5}
            display={formatEuro(current.versamentoMensile)}
            onChange={set("versamentoMensile", base.etf.versamentoMensile)}
          />
        )}
        <SliderRow
          id="wi-cresc"
          label="Crescita dello stipendio"
          category="ipotesi"
          value={current.crescitaStipendio}
          min={-2}
          max={6}
          step={0.1}
          display={formatPercent(current.crescitaStipendio, 1)}
          onChange={set("crescitaStipendio", base.career.crescitaStipendio)}
        />


        <div aria-live="polite" className="space-y-2">
          {changed ? (
            <>
              <ul className="space-y-2 text-sm">
                {messages.map((m) => (
                  <li key={m} className="rounded-lg border border-ipotesi/30 bg-ipotesi/5 p-3">
                    {m}
                  </li>
                ))}
              </ul>
              <p className="text-sm font-medium">
                Nel complesso il gap mensile (in euro di oggi) passa da {formatEuro(baseResult.reddito.gapReale)} a{" "}
                {formatEuro(result.reddito.gapReale)}.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nessuna modifica: stai vedendo lo scenario iniziale.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={!changed} onClick={() => onChange({})}>
            <RotateCcw aria-hidden /> Ripristina
          </Button>
          <Button size="sm" disabled={!changed} onClick={onApply}>
            <Save aria-hidden /> Applica alla simulazione
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

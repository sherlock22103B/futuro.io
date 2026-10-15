import { CheckCircle2, CircleDashed, CircleSlash, ShieldQuestion } from "lucide-react";
import type { CompletenessItem, CompletenessResult } from "@/lib/scenarios/completeness";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataCategoryBadge } from "@/components/common/DataCategoryBadge";

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold tabular">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ItemList({ title, items, icon: Icon, empty }: { title: string; items: CompletenessItem[]; icon: typeof CheckCircle2; empty: string }) {
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4" aria-hidden /> {title} <span className="text-muted-foreground">({items.length})</span>
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((i) => (
            <li key={i.campo} className="flex items-center justify-between gap-2 text-sm">
              <span>{i.etichetta}</span>
              <DataCategoryBadge category={i.categoria} compact />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** "Completezza della simulazione": conta i campi, NON stima la probabilità del risultato. */
export function DataCompletenessIndicator({ completeness }: { completeness: CompletenessResult }) {
  const c = completeness;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Completezza della simulazione</CardTitle>
        <CardDescription>
          Misura solo quanti dati hai inserito e da dove arrivano i valori. Non è la probabilità che il risultato si realizzi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-lg font-semibold">
          {c.isDemo ? (
            <>Simulazione basata su <span className="text-amber-200">dati dimostrativi inventati</span>.</>
          ) : (
            <>
              <span className="tabular text-certo">{c.percentualeDatiUtente}%</span> dei campi utilizza dati inseriti direttamente da te.
            </>
          )}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Meter label="Dati documentabili inseriti" value={c.percentualeDatiDocumentati} color="bg-certo" />
          <Meter label="Valori automatici configurati" value={c.percentualeParametriConfigurati} color="bg-regola" />
          <Meter label="Valori automatici da fonte pubblica" value={c.percentualeParametriVerificati} color="bg-regola" />
          <Meter label="Ipotesi lasciate ai valori predefiniti" value={c.percentualeIpotesiPredefinite} color="bg-ipotesi" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <ItemList title="Dati inseriti" items={c.inseriti} icon={CheckCircle2} empty="Nessun dato inserito." />
          <ItemList title="Dati mancanti" items={c.mancanti} icon={CircleSlash} empty="Nessun dato mancante." />
          <ItemList title="Valori predefiniti" items={c.predefiniti} icon={CircleDashed} empty="Hai personalizzato tutte le ipotesi." />
          <ItemList title="Valori automatici da fonte pubblica" items={c.automatici} icon={CheckCircle2} empty="Nessuno." />
          <ItemList title="Valori automatici da verificare (demo o stime)" items={c.daVerificare} icon={ShieldQuestion} empty="Tutti i valori automatici risultano verificati." />
        </div>
      </CardContent>
    </Card>
  );
}

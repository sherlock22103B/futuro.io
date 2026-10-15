import { CalendarClock, Landmark, Scale, TrendingUp } from "lucide-react";
import type { SimulationResult } from "@/lib/scenarios/calculateScenarios";
import Link from "next/link";
import { formatEuro, formatEuroDelta, formatPercent } from "@/lib/format";
import { DataCategoryBadge } from "@/components/common/DataCategoryBadge";
import { SourceTooltip } from "@/components/common/SourceTooltip";
import type { DataCategory } from "@/lib/types";
import type { GlossaryKey } from "@/lib/glossary";
import { cn } from "@/lib/utils";

function ResultCard({
  icon: Icon,
  title,
  value,
  accent,
  category,
  term,
  lines,
  delta,
}: {
  icon: typeof Landmark;
  title: string;
  value: string;
  accent: string;
  category: DataCategory;
  term?: GlossaryKey;
  lines: React.ReactNode[];
  delta?: string | null;
}) {
  return (
    <article className="relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-border bg-card/80 p-5 shadow-lg shadow-black/10">
      <div className={cn("absolute inset-x-0 top-0 h-1", accent)} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {title}
          {term && <SourceTooltip term={term} className="-my-1 h-7 w-7" />}
        </h3>
        <DataCategoryBadge category={category} compact />
      </div>
      <p className="text-3xl font-bold tabular tracking-tight sm:text-4xl">{value}</p>
      {delta && (
        <p className="text-sm font-medium text-ipotesi" aria-live="polite">
          {delta} rispetto allo scenario iniziale
        </p>
      )}
      <div className="space-y-0.5 text-sm text-muted-foreground">
        {lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
    </article>
  );
}

/** Le quattro card principali dei risultati, incluso il gap. */
export function ResultCards({ result, base }: { result: SimulationResult; base?: SimulationResult }) {
  const p = result.pensione.risultato;
  const e = result.etf.centrale.risultato;
  const r = result.reddito;
  const inp = result.input;
  const changed = base && base !== result;
  const d = (a?: number, b?: number) => (changed && a !== undefined && b !== undefined && Math.abs(a - b) >= 1 ? formatEuroDelta(a - b) : null);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ResultCard
        icon={CalendarClock}
        title="Età pensionabile scelta"
        value={`${inp.personal.etaPensionamento} anni`}
        accent="bg-ipotesi"
        category="ipotesi"
        term="etaPensionamento"
        delta={changed && base.input.personal.etaPensionamento !== inp.personal.etaPensionamento ? `${inp.personal.etaPensionamento - base.input.personal.etaPensionamento > 0 ? "+" : ""}${inp.personal.etaPensionamento - base.input.personal.etaPensionamento} anni` : null}
        lines={[`Nel ${p?.annoPensionamento ?? "—"}, tra ${r.anniAllaPensione} anni.`, "I requisiti effettivi di accesso non sono verificati dal simulatore."]}
      />
      <ResultCard
        icon={Landmark}
        title="Pensione pubblica lorda mensile stimata"
        value={formatEuro(p?.pensioneMensileLorda)}
        accent="bg-pension"
        category="regola"
        delta={d(p?.pensioneMensileLorda, base?.pensione.risultato?.pensioneMensileLorda)}
        lines={[
          `In euro di oggi: ${formatEuro(p?.pensioneMensileLordaReale)} · pagata per ${p?.mensilita ?? "—"} mensilità l'anno`,
          <span key="montante" className="mt-2 block rounded-lg border border-pension/30 bg-pension/5 p-2 text-xs text-slate-200">
            <strong>Da dove arriva?</strong> Fino alla pensione accumuli un «salvadanaio» di contributi, il <strong>montante</strong>: stimato in{" "}
            <strong className="tabular">{formatEuro(p?.montanteFinale)}</strong> a {inp.personal.etaPensionamento} anni. Non lo ricevi tutto insieme:
            ogni anno ne ricevi il {formatPercent((p?.coefficiente ?? 0) * 100, 2)} (coefficiente di trasformazione), cioè{" "}
            {formatEuro(p?.pensioneAnnuaLorda)} lordi l&apos;anno.
          </span>,
          inp.personal.pensioneInvalidita ? `In più, pensione di invalidità indicata da te: ${formatEuro(r.invaliditaMensileReale)}/mese.` : null,
          "Pensione pubblica stimata sulla base dei dati inseriti.",
        ].filter(Boolean)}
      />
      {result.etfAttivo ? (
        <ResultCard
          icon={TrendingUp}
          title="Capitale ETF finale ipotetico"
          value={formatEuro(e?.capitaleFinale)}
          accent="bg-etf"
          category="incerto"
          term="etf"
          delta={d(e?.capitaleFinale, base?.etf.centrale.risultato?.capitaleFinale)}
          lines={[
            `In euro di oggi: ${formatEuro(e?.capitaleFinaleReale)}`,
            `Intervallo: ${formatEuro(result.etf.prudente.risultato?.capitaleFinale)} – ${formatEuro(result.etf.favorevole.risultato?.capitaleFinale)}`,
            `Scenario centrale a ${result.valoriAutomatici.etaUtilizzo} anni, prima dell'eventuale tassazione finale.`,
          ]}
        />
      ) : (
        <ResultCard
          icon={TrendingUp}
          title="Capitale ETF ipotetico"
          value="Non simulato"
          accent="bg-etf"
          category="ipotesi"
          term="etf"
          lines={[
            "Hai scelto di simulare solo la pensione pubblica.",
            <Link key="add" href="/simulatore?passo=4" className="font-medium text-primary underline underline-offset-4">
              Aggiungi un piano ETF
            </Link>,
          ]}
        />
      )}
      <ResultCard
        icon={Scale}
        title="Gap rispetto al reddito desiderato"
        value={r.gapReale > 0 ? `${formatEuro(r.gapReale)}/mese` : "Nessun gap"}
        accent="bg-incerto"
        category="ipotesi"
        term="gap"
        delta={d(r.gapReale, base?.reddito.gapReale)}
        lines={[
          `In euro di oggi. Nominale nel ${p?.annoPensionamento ?? "—"}: ${formatEuro(r.gapNominale)}/mese`,
          `Coperto il ${Math.round(r.coperturaPercentuale)}% dei ${formatEuro(r.desideratoReale)} desiderati`,
          r.gapReale <= 0
            ? "Con queste ipotesi il reddito stimato raggiunge l'obiettivo."
            : result.etfAttivo
              ? "Pensione + integrazione ETF ipotetica, media mensile."
              : "Pensione pubblica, media mensile.",
        ]}
      />
    </div>
  );
}

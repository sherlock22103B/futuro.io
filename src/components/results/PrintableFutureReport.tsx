import type { SimulationResult } from "@/lib/scenarios/calculateScenarios";
import { WORK_CATEGORY_LABELS } from "@/lib/types";
import { pensionParameters } from "@/config/pensionParameters";
import { officialSources } from "@/config/officialSources";
import { MAIN_DISCLAIMER } from "@/components/layout/DisclaimerBanner";
import { formatDate, formatDateTime, formatEuro, formatPercent } from "@/lib/format";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold tabular">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print-avoid-break space-y-2">
      <h2 className="border-b-2 border-border pb-1 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

/** "Il mio futuro secondo i dati di oggi": riepilogo stampabile. */
export function PrintableFutureReport({ result }: { result: SimulationResult }) {
  const { input, pensione, etf, reddito } = result;
  const p = pensione.risultato;
  const scen = [etf.prudente, etf.centrale, etf.favorevole];
  const c = etf.centrale.risultato;

  return (
    <article className="print-area space-y-6 rounded-2xl border border-border bg-card/80 p-5 sm:p-8">
      <header className="space-y-1">
        <p className="text-sm font-semibold tracking-wider text-primary">FUTURO.IO</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Il mio futuro secondo i dati di oggi</h1>
        <p className="text-sm text-muted-foreground">Calcolo del {formatDateTime(result.calcolatoIl)}</p>
        {input.meta.isDemo && (
          <p className="text-sm font-semibold text-amber-200">ATTENZIONE: riepilogo basato su DATI DIMOSTRATIVI INVENTATI.</p>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Chi sei oggi">
          <dl>
            <Row label="Età" value={`${input.personal.eta} anni (nato/a nel ${input.personal.annoNascita})`} />
            <Row label="Categoria lavorativa" value={WORK_CATEGORY_LABELS[input.personal.categoria]} />
            <Row
              label={input.personal.categoria === "studente" ? `Stipendio iniziale previsto (da ${input.career.etaInizioLavoro} anni)` : "Stipendio lordo annuo"}
              value={formatEuro(input.career.stipendioAnnuo)}
            />
            <Row label="Anni di contribuzione" value={`${input.contributions.anniContributi} anni${input.contributions.mesiContributi ? ` e ${input.contributions.mesiContributi} mesi` : ""}`} />
            <Row label="Montante già maturato (stima automatica)" value={formatEuro(p?.montanteIniziale)} />
            {input.personal.pensioneInvalidita && (
              <Row label="Pensione di invalidità (indicata da te)" value={`${formatEuro(input.personal.importoInvalidita)}/mese`} />
            )}
            {result.etfAttivo && <Row label="Capitale ETF già investito" value={formatEuro(input.etf.capitaleIniziale)} />}
          </dl>
        </Section>

        <Section title="Pensione pubblica stimata">
          <dl>
            <Row label="Età pensionabile scelta" value={`${input.personal.etaPensionamento} anni (${p?.annoPensionamento})`} />
            <Row label="Montante finale (contributi accumulati e rivalutati)" value={formatEuro(p?.montanteFinale)} />
            <Row label="Coefficiente di trasformazione" value={formatPercent((p?.coefficiente ?? 0) * 100, 3)} />
            <Row label="Pensione lorda mensile" value={`${formatEuro(p?.pensioneMensileLorda)} × ${p?.mensilita}`} />
            <Row label="… in euro di oggi" value={formatEuro(p?.pensioneMensileLordaReale)} />
          </dl>
          <p className="text-xs text-muted-foreground">Pensione pubblica stimata sulla base dei dati inseriti.</p>
        </Section>
      </div>

      {result.etfAttivo ? (
      <Section title="Piano ETF ipotetico">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-1.5 text-left">Scenario</th>
                <th scope="col" className="py-1.5 text-right">Rendimento</th>
                <th scope="col" className="py-1.5 text-right">Capitale nominale</th>
                <th scope="col" className="py-1.5 text-right">In euro di oggi</th>
              </tr>
            </thead>
            <tbody>
              {scen.map((s) => (
                <tr key={s.risultato?.scenario.id} className="border-b border-border/60">
                  <th scope="row" className="py-1.5 text-left font-medium">{s.risultato?.scenario.nome}</th>
                  <td className="py-1.5 text-right tabular">{formatPercent((s.risultato?.scenario.rendimento ?? 0) * 100)}</td>
                  <td className="py-1.5 text-right tabular">{formatEuro(s.risultato?.capitaleFinale)}</td>
                  <td className="py-1.5 text-right tabular">{formatEuro(s.risultato?.capitaleFinaleReale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl>
          <Row label="Versamento mensile iniziale" value={formatEuro(input.etf.versamentoMensile)} />
          <Row label="Versamenti complessivi (escluso capitale iniziale)" value={formatEuro(c?.versamentiTotali)} />
          <Row label="Costi stimati (gestione + commissioni)" value={formatEuro(c?.costiTotali)} />
          <Row
            label="Piattaforma e commissione per rata"
            value={`${result.valoriAutomatici.piattaforma} · ${formatEuro(result.valoriAutomatici.commissionePAC, true)}`}
          />
          <Row label="Età in cui inizi a usare il capitale" value={`${result.valoriAutomatici.etaUtilizzo} anni`} />
        </dl>
        <p className="text-xs text-muted-foreground">Risultato prima dell&apos;eventuale tassazione finale. Scenari didattici, non previsioni.</p>
      </Section>
      ) : (
        <Section title="Piano ETF">
          <p className="text-sm">Non simulato: il riepilogo considera solo la pensione pubblica.</p>
        </Section>
      )}

      <Section title="Reddito futuro e gap previdenziale">
        <dl>
          <Row label="Reddito desiderato (euro di oggi)" value={`${formatEuro(reddito.desideratoReale)}/mese`} />
          <Row label="Pensione, media su 12 mesi (euro di oggi)" value={`${formatEuro(reddito.pensioneMediaMensileReale)}/mese`} />
          {input.personal.pensioneInvalidita && (
            <Row label="Pensione di invalidità (euro di oggi)" value={`${formatEuro(reddito.invaliditaMensileReale)}/mese`} />
          )}
          {result.etfAttivo && <Row label="Integrazione ETF ipotetica (euro di oggi)" value={`${formatEuro(reddito.etfMensileReale)}/mese`} />}
          <Row label="Gap previdenziale (euro di oggi)" value={reddito.gapReale > 0 ? `${formatEuro(reddito.gapReale)}/mese` : "Nessun gap"} />
          <Row label="Gap in euro dell'anno di pensione" value={`${formatEuro(reddito.gapNominale)}/mese`} />
          <Row label="Inflazione (automatica, obiettivo BCE)" value={formatPercent(result.valoriAutomatici.inflazione)} />
        </dl>
        <p className="text-xs text-muted-foreground">L&apos;integrazione ETF è una simulazione di prelievo e non una rendita garantita.</p>
      </Section>

      <Section title="Metodologia in breve">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Pensione: calcolo contributivo anno per anno (contributi = stipendio × aliquota; montante rivalutato + contributi; pensione = montante × coefficiente).</li>
          <li>ETF: calcolo mese per mese con rendimento mensile equivalente (1 + r)^(1/12) − 1, commissioni e costo annuo ÷ 12 sottratti separatamente.</li>
          <li>Valori reali: valore nominale ÷ (1 + inflazione)^anni.</li>
          <li>Importi lordi: nessuna tassazione applicata.</li>
        </ul>
      </Section>

      <Section title="Fonti e parametri">
        <p className="text-sm">
          Parametri aggiornati al {formatDate(pensionParameters.dataAggiornamento)}. <strong>Tutti i parametri normativi sono valori dimostrativi da sostituire con quelli ufficiali.</strong>
        </p>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {officialSources.map((s) => (
            <li key={s.id}>
              {s.nome}: <span className="text-muted-foreground">{s.url}</span>
            </li>
          ))}
        </ul>
      </Section>

      <footer className="rounded-xl border border-border p-4 text-xs leading-relaxed">{MAIN_DISCLAIMER}</footer>
    </article>
  );
}

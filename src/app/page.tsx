import Link from "next/link";
import { ArrowRight, Eye, Lock, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroAnimation } from "@/components/home/HeroAnimation";
import { HomePreviewCards } from "@/components/home/HomePreviewCards";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { DataCategoryBadge, CATEGORY_META } from "@/components/common/DataCategoryBadge";
import type { DataCategory } from "@/lib/types";

const CATEGORIES: { cat: DataCategory; examples: string }[] = [
  { cat: "certo", examples: "Età, stipendio attuale, anni di contributi, montante già maturato, capitale già investito." },
  { cat: "regola", examples: "Aliquota contributiva, coefficiente di trasformazione, età pensionabile, mensilità." },
  { cat: "ipotesi", examples: "Crescita dello stipendio, anni di lavoro, versamento mensile, rendimento ipotizzato." },
  { cat: "incerto", examples: "Rendimenti futuri, inflazione, rivalutazione del montante, cambi normativi." },
];

export default function HomePage() {
  return (
    <div className="space-y-20 pb-8">
      {/* Hero */}
      <section className="container grid items-center gap-10 pt-10 md:grid-cols-2 md:pt-16" aria-labelledby="hero-title">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-etf">Calcola oggi il reddito del tuo domani.</p>
          <h1 id="hero-title" className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Quanto varrà il tuo futuro?
          </h1>
          <p className="max-w-xl text-lg text-slate-300">
            Calcola la pensione pubblica stimata, simula un piano ETF e scopri quanto potrebbe mancare al reddito che desideri.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/simulatore">
                Calcola il mio futuro <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/come-funziona">Scopri come funziona</Link>
            </Button>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-certo" aria-hidden /> I dati restano sul tuo dispositivo</li>
            <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-regola" aria-hidden /> Nessun account, nessun prodotto in vendita</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-card/60 p-4 sm:p-6">
          <HeroAnimation />
        </div>
      </section>

      <section className="container" aria-label="Cosa calcola FUTURO.IO">
        <HomePreviewCards />
      </section>

      {/* Non indoviniamo il futuro */}
      <section className="container" aria-labelledby="no-guess-title">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card to-background p-6 sm:p-10">
          <div className="max-w-2xl space-y-3">
            <Eye className="h-7 w-7 text-ipotesi" aria-hidden />
            <h2 id="no-guess-title" className="text-3xl font-bold">Non indoviniamo il futuro</h2>
            <p className="text-lg text-slate-300">
              Separiamo i dati che conosci dalle ipotesi che possono cambiare. Così puoi capire non soltanto il risultato, ma anche da dove arriva.
            </p>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map(({ cat, examples }) => (
              <li key={cat} className="rounded-2xl border border-border bg-card/70 p-5">
                <DataCategoryBadge category={cat} />
                <p className="mt-3 text-sm font-medium">{CATEGORY_META[cat].description}</p>
                <p className="mt-2 text-sm text-muted-foreground">{examples}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container grid gap-6 md:grid-cols-3" aria-label="Come funziona in breve">
        {[
          { n: "1", t: "Inserisci quello che sai", d: "Età, stipendio lordo, contributi. Se non conosci un dato, te lo diciamo e usiamo un valore segnalato." },
          { n: "2", t: "Scegli le tue ipotesi", d: "Crescita dello stipendio, versamento mensile, rendimento ipotetico, inflazione. Ogni ipotesi è modificabile." },
          { n: "3", t: "Guarda come cambia", d: "Grafici interattivi, scenari a confronto e slider per vedere subito l'effetto di ogni scelta." },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl border border-border bg-card/60 p-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 font-bold text-primary" aria-hidden>
              {s.n}
            </span>
            <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </section>

      <section className="container space-y-6 text-center" aria-labelledby="cta-title">
        <SlidersHorizontal className="mx-auto h-8 w-8 text-primary" aria-hidden />
        <h2 id="cta-title" className="text-2xl font-bold sm:text-3xl">Bastano pochi minuti</h2>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/simulatore">Calcola il mio futuro <ArrowRight aria-hidden /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/metodologia">Leggi la metodologia</Link>
          </Button>
        </div>
        <DisclaimerBanner className="mx-auto max-w-3xl text-left" />
      </section>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroAnimation } from "@/components/home/HeroAnimation";
import { HomePreviewCards } from "@/components/home/HomePreviewCards";
import { DataCategoryBadge } from "@/components/common/DataCategoryBadge";
import type { DataCategory } from "@/lib/types";

const CATEGORIES: DataCategory[] = ["certo", "regola", "ipotesi", "incerto"];

export default function HomePage() {
  return (
    <div className="space-y-16 pb-8 sm:space-y-24">
      {/* Hero */}
      <section className="container grid items-center gap-10 pt-10 md:grid-cols-2 md:pt-20" aria-labelledby="hero-title">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-etf">Calcola oggi il reddito del tuo domani.</p>
          <h1 id="hero-title" className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Quanto varrà il tuo futuro?
          </h1>
          <p className="max-w-lg text-lg text-slate-300">
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
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 text-certo" aria-hidden /> I dati restano sul tuo dispositivo. Nessun account.
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card/50 p-4 sm:p-6">
          <HeroAnimation />
        </div>
      </section>

      <section className="container" aria-label="Cosa calcola FUTURO.IO">
        <HomePreviewCards />
      </section>

      {/* Non indoviniamo il futuro */}
      <section className="container" aria-labelledby="no-guess-title">
        <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card/40 p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-2">
            <h2 id="no-guess-title" className="text-2xl font-bold sm:text-3xl">
              Non indoviniamo il futuro
            </h2>
            <p className="text-slate-300">
              Separiamo i dati che conosci dalle ipotesi che possono cambiare. Così puoi capire non soltanto il risultato, ma anche da dove arriva.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-2 md:shrink-0" aria-label="Le quattro categorie di dati">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <DataCategoryBadge category={c} className="w-full justify-center py-1.5 text-xs" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container text-center" aria-labelledby="cta-title">
        <h2 id="cta-title" className="text-2xl font-bold">Bastano pochi minuti</h2>
        <Button asChild size="lg" className="mt-5">
          <Link href="/simulatore">
            Inizia ora <ArrowRight aria-hidden />
          </Link>
        </Button>
      </section>
    </div>
  );
}

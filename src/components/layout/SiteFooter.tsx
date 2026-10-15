"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { DisclaimerBanner } from "./DisclaimerBanner";
import { Switch } from "@/components/ui/switch";
import { useSimulation } from "@/components/providers/SimulationProvider";
import { Logo } from "./SiteHeader";

export function SiteFooter() {
  const { reduceMotion, setReduceMotion } = useSimulation();
  return (
    <footer className="no-print mt-16 border-t border-border/70 pb-24 pt-10 md:pb-10">
      <div className="container space-y-6">
        <DisclaimerBanner compact />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Logo />
            <p className="text-sm text-muted-foreground">Calcola oggi il reddito del tuo domani.</p>
            <p className="flex items-center gap-2 text-sm text-certo">
              <Lock className="h-4 w-4" aria-hidden /> I dati restano sul tuo dispositivo
            </p>
          </div>
          <nav aria-label="Collegamenti del sito">
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li><Link className="hover:text-primary hover:underline" href="/simulatore">Simulatore</Link></li>
              <li><Link className="hover:text-primary hover:underline" href="/risultati">Risultati</Link></li>
              <li><Link className="hover:text-primary hover:underline" href="/confronta">Confronta scenari</Link></li>
              <li><Link className="hover:text-primary hover:underline" href="/report">Il mio futuro (stampa)</Link></li>
              <li><Link className="hover:text-primary hover:underline" href="/come-funziona">Come funziona</Link></li>
              <li><Link className="hover:text-primary hover:underline" href="/metodologia">Fonti e metodologia</Link></li>
              <li><Link className="hover:text-primary hover:underline" href="/privacy">Privacy e disclaimer</Link></li>
            </ul>
          </nav>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Switch id="reduce-motion" checked={reduceMotion} onCheckedChange={setReduceMotion} />
              <label htmlFor="reduce-motion" className="cursor-pointer text-sm font-medium">
                Riduci animazioni
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Nessun tracker pubblicitario, nessun account, nessun dato inviato a server esterni.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

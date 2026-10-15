"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NewSimulationButton } from "./NewSimulationButton";
import { cn } from "@/lib/utils";

export const MAIN_NAV = [
  { href: "/simulatore", label: "Simula il futuro", match: ["/simulatore", "/risultati", "/confronta", "/report"] },
  { href: "/come-funziona", label: "Come funziona", match: ["/come-funziona"] },
  { href: "/metodologia", label: "Fonti", match: ["/metodologia"] },
];

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-tight", className)}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#0f1b33" stroke="#2a3b5f" />
        <path d="M5 24 C 12 22, 17 16, 26 9" stroke="#60a5fa" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M5 27 C 13 25, 19 19, 26 9" stroke="#4ade80" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <circle cx="26" cy="9" r="3" fill="#f8fafc" />
      </svg>
      <span>
        FUTURO<span className="text-etf">.IO</span>
      </span>
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <a href="#contenuto" className="sr-only-focusable absolute left-2 top-2 z-50 rounded bg-primary px-3 py-2 text-primary-foreground">
        Vai al contenuto
      </a>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="FUTURO.IO, torna alla home" className="rounded-md">
          <Logo className="text-lg" />
        </Link>
        <nav aria-label="Navigazione principale" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAV.map((item) => {
              const active = item.match.some((m) => pathname?.startsWith(m));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-accent",
                      active ? "bg-accent text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="ml-2">
              <NewSimulationButton />
            </li>
          </ul>
        </nav>
        <p className="text-xs text-muted-foreground md:hidden">Calcola oggi il reddito del tuo domani.</p>
      </div>
    </header>
  );
}

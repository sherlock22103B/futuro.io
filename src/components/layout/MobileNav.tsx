"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calculator, Library } from "lucide-react";
import { NewSimulationButton } from "./NewSimulationButton";
import { MAIN_NAV } from "./SiteHeader";
import { cn } from "@/lib/utils";

const ICONS = [Calculator, BookOpen, Library];
const SHORT = ["Simula", "Come funziona", "Fonti"];

/** Navigazione inferiore per smartphone. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigazione principale"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="flex">
        {MAIN_NAV.map((item, i) => {
          const Icon = ICONS[i];
          const active = item.match.some((m) => pathname?.startsWith(m));
          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {SHORT[i]}
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <NewSimulationButton variant="mobile" />
        </li>
      </ul>
    </nav>
  );
}

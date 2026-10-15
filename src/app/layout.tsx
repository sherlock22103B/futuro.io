import type { Metadata, Viewport } from "next";
import "./globals.css";
import { withBasePath } from "@/lib/basePath";
import { SimulationProvider } from "@/components/providers/SimulationProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileNav } from "@/components/layout/MobileNav";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: {
    default: "FUTURO.IO — Calcola oggi il reddito del tuo domani",
    template: "%s · FUTURO.IO",
  },
  description:
    "Simulatore educativo: stima la pensione pubblica con logica contributiva, simula un piano di accumulo ETF e scopri il gap rispetto al reddito che desideri.",
  applicationName: "FUTURO.IO",
  icons: { icon: withBasePath("/icon.svg"), apple: withBasePath("/icon.svg") },
  manifest: withBasePath("/manifest.webmanifest"),
  appleWebApp: { capable: true, title: "FUTURO.IO", statusBarStyle: "black-translucent" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a1224",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <SimulationProvider>
          <SiteHeader />
          <main id="contenuto" tabIndex={-1} className="focus:outline-none">
            {children}
          </main>
          <SiteFooter />
          <MobileNav />
          <ServiceWorkerRegister />
        </SimulationProvider>
      </body>
    </html>
  );
}

import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/basePath";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FUTURO.IO — Calcola oggi il reddito del tuo domani",
    short_name: "FUTURO.IO",
    description: "Simulatore educativo di pensione pubblica e piano di accumulo ETF.",
    lang: "it",
    start_url: withBasePath("/"),
    scope: withBasePath("/"),
    display: "standalone",
    background_color: "#0a1224",
    theme_color: "#0a1224",
    categories: ["education", "finance"],
    icons: [
      { src: withBasePath("/icon.svg"), sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: withBasePath("/icon-maskable.svg"), sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}

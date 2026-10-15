"use client";

import { useEffect } from "react";
import { withBasePath } from "@/lib/basePath";

/** Registra il service worker (solo in produzione) per rendere l'app installabile e utilizzabile offline. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(withBasePath("/sw.js"), { scope: withBasePath("/") }).catch(() => {
      /* registrazione non riuscita: l'app funziona comunque online */
    });
  }, []);
  return null;
}

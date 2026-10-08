"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // En développement, le Service Worker met en cache les bundles JS
    // (cache-first sur /_next/static/) : avec le rechargement à chaud et des
    // noms de chunks réutilisés entre redémarrages, cela peut servir un JS
    // obsolète (ex. anciens gestionnaires de clic) même après correction du
    // code. On désinscrit tout SW déjà présent et on n'enregistre que sur
    // un build de production.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silently ignore - PWA install is a progressive enhancement, not required.
    });
  }, []);

  return null;
}

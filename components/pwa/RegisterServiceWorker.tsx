"use client"

import * as React from "react"

/**
 * Registers /sw.js in production so the app meets PWA install criteria and the worker controls the scope.
 * Skipped in development to avoid interfering with Next.js fast refresh.
 */
export function RegisterServiceWorker() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    void navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        type: "classic",
        updateViaCache: "none",
      })
      .catch((e) => console.warn("[pwa] service worker registration failed", e))
  }, [])

  return null
}

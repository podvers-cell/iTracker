"use client"

import * as React from "react"

import { useI18n } from "@/components/i18n/I18nProvider"
import { cn } from "@/lib/utils"
import { SplashStyleBackdrop, SplashStyleLogoHero } from "@/components/shell/splash-shared"

const MIN_MS = 2100
const EXIT_MS = 720

export function SplashScreen() {
  const { dict, locale } = useI18n()
  const [phase, setPhase] = React.useState<"show" | "exit" | "gone">("show")

  React.useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const min = reduce ? 420 : MIN_MS
    const exit = reduce ? 180 : EXIT_MS

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const restoreScroll = () => {
      document.body.style.overflow = prevOverflow || ""
    }

    const t1 = window.setTimeout(() => setPhase("exit"), min)
    const t2 = window.setTimeout(() => {
      setPhase("gone")
      restoreScroll()
    }, min + exit)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      restoreScroll()
    }
  }, [])

  if (phase === "gone") return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={phase === "show"}
      aria-label={locale === "ar" ? "جاري فتح التطبيق" : "Loading app"}
      className={cn(
        "fixed inset-0 z-[9999] flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden",
        "transition-[opacity,transform,filter] ease-[cubic-bezier(0.22,1,0.36,1)]",
        phase === "exit"
          ? "pointer-events-none scale-[1.03] opacity-0 blur-md duration-[720ms]"
          : "opacity-100 duration-500"
      )}
    >
      <SplashStyleBackdrop />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
        <SplashStyleLogoHero alt="" className="mb-9" logoClassName="splash-logo-enter" />

        <h1
          className={cn(
            "text-center text-[1.65rem] font-bold tracking-tight text-white sm:text-4xl",
            "drop-shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
          )}
        >
          {dict.appName}
        </h1>
        <p className="mt-3 max-w-[min(22rem,calc(100vw-2rem))] text-center text-sm leading-relaxed text-white/75 sm:text-[0.9375rem]">
          {dict.common.splashTagline}
        </p>

        <div className="mt-11 flex items-center gap-2" aria-hidden>
          <span className="splash-dot size-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
          <span className="splash-dot size-2 rounded-full bg-white/70" />
          <span className="splash-dot size-2 rounded-full bg-white/45" />
        </div>

        <div className="mt-9 h-1.5 w-[min(18rem,calc(100vw-4rem))] overflow-hidden rounded-full bg-black/20 ring-1 ring-white/20">
          <div className="splash-progress-bar h-full rounded-full bg-gradient-to-r from-white via-violet-100 to-cyan-200 shadow-[0_0_24px_rgba(255,255,255,0.45)]" />
        </div>
      </div>
    </div>
  )
}

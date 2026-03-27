"use client"

import * as React from "react"

import { useI18n } from "@/components/i18n/I18nProvider"
import { cn } from "@/lib/utils"

const MIN_MS = 2100
const EXIT_MS = 750

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
      // Component stays mounted (returns null); restore scroll here — cleanup only runs on full unmount.
      restoreScroll()
    }, min + exit)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      restoreScroll()
    }
  }, [])

  if (phase === "gone") return null

  const tagline =
    locale === "ar"
      ? "نرصّ الصفوف قبل ما تبدأ يومك"
      : "Lining up your day — almost there…"

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={phase === "show"}
      aria-label={locale === "ar" ? "جاري فتح التطبيق" : "Loading app"}
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center",
        "transition-[opacity,transform,filter] ease-[cubic-bezier(0.22,1,0.36,1)]",
        phase === "exit"
          ? "pointer-events-none scale-105 opacity-0 blur-sm duration-[750ms]"
          : "opacity-100 duration-500"
      )}
    >
      {/* Base + subtle vignette */}
      <div className="absolute inset-0 bg-zinc-950" />
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 80%, rgba(168,85,247,0.2), transparent 50%), radial-gradient(ellipse 60% 40% at 0% 90%, rgba(6,182,212,0.12), transparent 45%)",
        }}
      />

      {/* Soft orbs */}
      <div
        className="splash-orb-1 pointer-events-none absolute -left-[20%] top-[15%] h-[min(85vw,420px)] w-[min(85vw,420px)] rounded-full bg-violet-500/40 blur-[64px]"
        aria-hidden
      />
      <div
        className="splash-orb-2 pointer-events-none absolute -right-[15%] bottom-[5%] h-[min(75vw,360px)] w-[min(75vw,360px)] rounded-full bg-indigo-600/35 blur-[56px]"
        aria-hidden
      />
      <div
        className="splash-orb-3 pointer-events-none absolute left-[20%] bottom-[25%] h-[min(55vw,280px)] w-[min(55vw,280px)] rounded-full bg-cyan-500/25 blur-[48px]"
        aria-hidden
      />

      {/* Fine grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex max-w-md flex-col items-center px-8">
        <div className="relative mb-8 grid h-36 w-36 place-items-center">
          <div
            className="splash-ring-spin pointer-events-none absolute -inset-1 rounded-full border-2 border-dashed border-white/30"
            aria-hidden
          />
          <div
            className="splash-ring-spin-rev pointer-events-none absolute -inset-4 rounded-full border border-violet-400/40"
            aria-hidden
          />
          <div className="relative overflow-hidden rounded-3xl shadow-[0_0_60px_-12px_rgba(99,102,241,0.55)] ring-2 ring-white/10">
            <div
              className="splash-shine pointer-events-none absolute inset-0 z-10 w-[40%] bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-70"
              aria-hidden
            />
            <img
              src="/logo.svg"
              alt=""
              width={112}
              height={112}
              className="splash-logo-enter relative z-[1] size-28 object-contain"
            />
          </div>
        </div>

        <h1
          className={cn(
            "text-center text-3xl font-bold tracking-tight sm:text-4xl",
            "bg-gradient-to-br from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent",
            "drop-shadow-[0_2px_24px_rgba(99,102,241,0.35)]"
          )}
        >
          {dict.appName}
        </h1>
        <p className="mt-3 max-w-[260px] text-center text-sm leading-relaxed text-zinc-400">{tagline}</p>

        <div className="mt-10 flex items-center gap-1.5" aria-hidden>
          <span className="splash-dot size-1.5 rounded-full bg-violet-400" />
          <span className="splash-dot size-1.5 rounded-full bg-fuchsia-400" />
          <span className="splash-dot size-1.5 rounded-full bg-cyan-400" />
        </div>

        <div className="mt-8 h-1 w-52 overflow-hidden rounded-full bg-zinc-800/90 ring-1 ring-white/10">
          <div className="splash-progress-bar h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
        </div>
      </div>
    </div>
  )
}

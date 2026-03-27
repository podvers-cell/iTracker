"use client"

import * as React from "react"
import Link from "next/link"

import { AppLogo } from "@/components/branding/AppLogo"
import { SplashStyleBackdrop } from "@/components/shell/splash-shared"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function useIsStandalone() {
  const [standalone, setStandalone] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)")
    const check = () =>
      setStandalone(
        mq.matches ||
          (window.navigator as Navigator & { standalone?: boolean }).standalone === true
      )
    check()
    mq.addEventListener("change", check)
    return () => mq.removeEventListener("change", check)
  }, [])

  return standalone
}

function usePlatform() {
  return React.useMemo(() => {
    if (typeof navigator === "undefined") return { ios: false, android: false }
    const ua = navigator.userAgent || ""
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    const android = /Android/i.test(ua)
    return { ios, android }
  }, [])
}

const glassPanel =
  "rounded-[2rem] border border-white/25 bg-white/20 text-foreground shadow-[0_12px_40px_rgba(91,33,182,0.15)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)]"

const glassInset =
  "rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-foreground/90 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"

export function InstallLanding() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = React.useState(false)
  const standalone = useIsStandalone()
  const { ios } = usePlatform()

  React.useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall)
  }, [])

  const canBrowserInstall = Boolean(deferred)

  async function onInstallClick() {
    if (standalone) return
    if (deferred) {
      setInstalling(true)
      try {
        await deferred.prompt()
        await deferred.userChoice
      } finally {
        setInstalling(false)
        setDeferred(null)
      }
      return
    }
    if (ios) {
      document.getElementById("instructions-ios")?.scrollIntoView({ behavior: "smooth", block: "start" })
      return
    }
    document.getElementById("instructions-desktop")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden text-foreground">
      <SplashStyleBackdrop className="fixed inset-0 -z-10 min-h-full" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-background/30 dark:bg-zinc-950/55" />

      <div className="relative z-0 mx-auto flex min-h-[100dvh] max-w-lg flex-col px-5 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <header className="mb-6 flex shrink-0 items-start justify-end gap-2">
          <Link
            href="/login"
            className="rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition-colors hover:bg-white/25"
          >
            Sign in
          </Link>
        </header>

        <div className="flex flex-1 flex-col items-center text-center">
          <div
            className={`mb-8 grid size-28 place-items-center rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(79,70,229,0.45)] ring-2 ring-white/40 dark:ring-white/10 ${glassPanel}`}
          >
            <AppLogo alt="" className="size-[104px] rounded-2xl" />
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-white drop-shadow-md sm:text-5xl">iTrack</h1>
          <p className="mt-3 max-w-sm text-pretty text-base leading-relaxed text-white/75">
            Track finishing projects, customers, and finances in one place — works offline-capable as an installed app.
          </p>

          <div className={`mt-10 w-full max-w-sm p-6 ${glassPanel}`}>
            {standalone ? (
              <>
                <p className="text-sm font-medium text-foreground/90">You&apos;re using the installed app.</p>
                <Link
                  href="/dashboard"
                  className="mt-5 flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-95 active:scale-[0.99]"
                >
                  Open iTrack
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void onInstallClick()}
                  disabled={installing}
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
                >
                  {installing ? "Installing…" : "Install App"}
                </button>
                {!canBrowserInstall && !ios ? (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    If the button doesn&apos;t prompt you, use your browser&apos;s install option (menu below).
                  </p>
                ) : null}
              </>
            )}

            <Link
              href="/dashboard"
              className="mt-4 block text-center text-sm font-semibold text-white/90 underline-offset-4 hover:text-white hover:underline"
            >
              Continue in browser →
            </Link>
          </div>

          <section className="mt-14 w-full max-w-sm space-y-4 text-start" aria-labelledby="how-install">
            <h2 id="how-install" className="text-center text-sm font-semibold uppercase tracking-widest text-white/70">
              How to install
            </h2>

            <div id="instructions-ios" className={`${glassPanel} p-5`}>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-white/30 px-2.5 py-0.5 text-xs font-semibold dark:bg-white/10">iPhone</span>
                <span className="text-sm font-medium">Safari</span>
              </div>
              <ol className="list-decimal space-y-2 ps-4 text-sm leading-relaxed text-muted-foreground">
                <li>Tap the Share button <span className="whitespace-nowrap font-medium text-foreground/80">(square with arrow)</span>.</li>
                <li>
                  Scroll and tap <span className="font-medium text-foreground/80">Add to Home Screen</span>.
                </li>
                <li>Tap <span className="font-medium text-foreground/80">Add</span> — then open iTrack from your Home Screen.</li>
              </ol>
            </div>

            <div id="instructions-android" className={`${glassPanel} p-5`}>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-white/30 px-2.5 py-0.5 text-xs font-semibold dark:bg-white/10">
                  Android
                </span>
                <span className="text-sm font-medium">Chrome</span>
              </div>
              <ol className="list-decimal space-y-2 ps-4 text-sm leading-relaxed text-muted-foreground">
                <li>
                  Tap the browser menu <span className="font-medium text-foreground/80">(⋮)</span> in the top corner.
                </li>
                <li>
                  Tap <span className="font-medium text-foreground/80">Install app</span> or{" "}
                  <span className="font-medium text-foreground/80">Add to Home screen</span>.
                </li>
                <li>Confirm — the app icon appears on your home screen.</li>
              </ol>
            </div>

            <div id="instructions-desktop" className={`${glassPanel} p-5`}>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-white/30 px-2.5 py-0.5 text-xs font-semibold dark:bg-white/10">
                  Desktop
                </span>
                <span className="text-sm font-medium">Chrome · Edge · Brave</span>
              </div>
              <ol className="list-decimal space-y-2 ps-4 text-sm leading-relaxed text-muted-foreground">
                <li>
                  Look for the install icon in the address bar <span className="font-medium text-foreground/80">(⊕ or monitor)</span>.
                </li>
                <li>
                  Or open the menu → <span className="font-medium text-foreground/80">Install iTrack…</span> /{" "}
                  <span className="font-medium text-foreground/80">Apps</span>.
                </li>
                <li>
                  Safari on Mac: <span className="font-medium text-foreground/80">File → Add to Dock</span> (macOS Sonoma+).
                </li>
              </ol>
            </div>

            <p className={`text-center text-xs leading-relaxed text-muted-foreground ${glassInset}`}>
              Install requires a supported browser. After installing, sign in to sync your projects and data.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

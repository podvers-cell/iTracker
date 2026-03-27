"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import type { Dictionary } from "@/lib/i18n/dictionaries"
import { getDictionary } from "@/lib/i18n/dictionaries"
import type { Locale } from "@/lib/i18n/locales"
import { DEFAULT_LOCALE, getDir, LOCALE_COOKIE } from "@/lib/i18n/locales"

type I18nContextValue = {
  locale: Locale
  dir: "rtl" | "ltr"
  dict: Dictionary
  setLocale: (next: Locale) => void
}

const I18nContext = React.createContext<I18nContextValue | null>(null)

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale?: Locale
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [locale, setLocaleState] = React.useState<Locale>(
    initialLocale ?? DEFAULT_LOCALE
  )

  const dict = React.useMemo(() => getDictionary(locale), [locale])
  const dir = React.useMemo(() => getDir(locale), [locale])

  React.useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
    document.documentElement.classList.remove("font-ar", "font-en")
    document.documentElement.classList.add(locale === "ar" ? "font-ar" : "font-en")
  }, [locale, dir])

  const setLocale = React.useCallback(
    (next: Locale) => {
      if (next === locale) return

      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
      setLocaleState(next)

      // Ensure Server Components + metadata re-render with new cookie.
      router.refresh()

      // If current page depends on dir for layout, force reflow.
      if (pathname) {
        // no-op; keep current route
      }
    },
    [locale, router, pathname]
  )

  return (
    <I18nContext.Provider value={{ locale, dir, dict, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = React.useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}


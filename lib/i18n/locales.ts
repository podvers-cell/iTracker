export const LOCALES = ["ar", "en"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "ar"
export const LOCALE_COOKIE = "locale"

export function getDir(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr"
}


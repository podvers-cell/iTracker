export const DEFAULT_CURRENCY = "AED"

function localeTag(locale: string) {
  return locale === "ar" ? "ar-AE" : "en-AE"
}

/** Formatted amount only (no currency). Use with `Money` or `UaeDirhamSymbol` in UI. */
export function formatMoneyAmount(amount: number, locale: string) {
  try {
    return new Intl.NumberFormat(localeTag(locale), {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount)
  } catch {
    return String(amount)
  }
}


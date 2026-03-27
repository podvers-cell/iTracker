export const DEFAULT_CURRENCY = "AED"

export function formatMoney(amount: number, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: DEFAULT_CURRENCY,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return String(amount)
  }
}


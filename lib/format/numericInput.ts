/**
 * Normalize Arabic-Indic (٠–٩ U+0660–U+0669) and Persian (۰–۹ U+06F0–U+06F9)
 * digits to Western ASCII 0–9. Other characters unchanged.
 */
export function normalizeDigitsToWestern(value: string): string {
  let out = ""
  for (const ch of value) {
    const c = ch.codePointAt(0)
    if (c === undefined) continue
    if (c >= 0x0660 && c <= 0x0669) out += String(c - 0x0660)
    else if (c >= 0x06f0 && c <= 0x06f9) out += String(c - 0x06f0)
    else out += ch
  }
  return out
}

/**
 * Parse a money/amount field: Arabic or Western digits, optional grouping,
 * Western comma or Arabic thousands separator ٬, Arabic decimal ٫ or dot.
 */
export function parseLocalizedAmount(raw: string): number {
  const normalized = normalizeDigitsToWestern(raw.trim())
    .replaceAll(",", "")
    .replaceAll("٬", "")
    .replaceAll("٫", ".")
  return Number(normalized)
}

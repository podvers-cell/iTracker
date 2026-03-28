/** Calendar date in the user's local timezone as YYYY-MM-DD (HTML form convention). */
export function toISODateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Parse YYYY-MM-DD as a local calendar date (no UTC shift). */
export function parseISODateLocal(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const day = Number(m[3])
  const d = new Date(y, mo, day)
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== day) return null
  return d
}

/** Parse 8-digit YYYYMMDD (compact or from stripped ISO) into strict local YYYY-MM-DD. */
function parseYYYYMMDDCompactDigits(digits: string): string | null {
  if (!/^\d{8}$/.test(digits)) return null
  const y = Number(digits.slice(0, 4))
  const mo = Number(digits.slice(4, 6))
  const day = Number(digits.slice(6, 8))
  if (y < 1990 || y > 2100 || mo < 1 || mo > 12 || day < 1 || day > 31) return null
  const d = new Date(y, mo - 1, day)
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== day) return null
  return toISODateLocal(d)
}

/**
 * Firestore / importers sometimes store calendar day as integer `20260328` (not epoch ms).
 * `new Date(20260328)` would be wrong (1970); use this first when reading `date`.
 */
export function calendarDateFromCompactNumber(n: number): string | null {
  if (!Number.isFinite(n)) return null
  const iv = Math.trunc(n)
  if (iv < 10_000_000 || iv > 99_999_999) return null
  return parseYYYYMMDDCompactDigits(String(iv).padStart(8, "0"))
}

/**
 * Coerce a stored calendar value to strict YYYY-MM-DD (zero-padded).
 * Fixes mismatches where `2026-3-5` would not equal `2026-03-05`, and ISO datetimes
 * like `2026-03-28T00:00:00.000Z` which must not be compared to plain dates.
 */
export function normalizeCalendarDateString(input: string): string {
  let s = input.trim()
  if (s.includes("T")) {
    s = s.split("T")[0] ?? s
  } else if (/\s/.test(s)) {
    s = s.split(/\s+/)[0] ?? s
  }
  s = s.replace(/Z$/i, "")

  const digitsOnly = s.replace(/\D/g, "")
  if (digitsOnly.length === 8 && /^\d{8}$/.test(digitsOnly)) {
    const compact = parseYYYYMMDDCompactDigits(digitsOnly)
    if (compact) return compact
  }

  const loose = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s)
  if (loose) {
    const y = Number(loose[1])
    const mo = Number(loose[2])
    const day = Number(loose[3])
    const d = new Date(y, mo - 1, day)
    if (d.getFullYear() === y && d.getMonth() === mo - 1 && d.getDate() === day) {
      return toISODateLocal(d)
    }
  }
  const strict = parseISODateLocal(s)
  if (strict) return toISODateLocal(strict)
  return s
}

/** Lexicographic compare for YYYY-MM-DD strings. */
export function compareISODates(a: string, b: string): number {
  if (a === b) return 0
  return a < b ? -1 : 1
}

/** Every local calendar day from `startIso` through `endIso` inclusive (YYYY-MM-DD). */
export function eachLocalDayIsoInclusive(startIso: string, endIso: string): string[] {
  const start = parseISODateLocal(normalizeCalendarDateString(startIso))
  const end = parseISODateLocal(normalizeCalendarDateString(endIso))
  if (!start || !end || start > end) return []
  const out: string[] = []
  const cur = new Date(start)
  while (cur <= end) {
    out.push(toISODateLocal(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

/** Human-readable calendar date (same rules as DatePickerField). */
export function formatISODateForDisplay(iso: string, locale: string): string {
  const normalized = normalizeCalendarDateString(iso.trim())
  const d = parseISODateLocal(normalized)
  if (!d) return iso
  const localeTag = locale === "ar" ? "ar" : undefined
  return new Intl.DateTimeFormat(localeTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d)
}

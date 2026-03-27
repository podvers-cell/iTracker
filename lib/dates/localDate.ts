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

/** Lexicographic compare for YYYY-MM-DD strings. */
export function compareISODates(a: string, b: string): number {
  if (a === b) return 0
  return a < b ? -1 : 1
}

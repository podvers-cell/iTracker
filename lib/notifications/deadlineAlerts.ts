import type { Project } from "@/lib/data/projects"
import { projectCollectedTotal, projectUncollected } from "@/lib/data/projectFinance"

/** Days ahead (and same count for overdue) to surface delivery / collection alerts. */
export const DEADLINE_ALERT_WINDOW_DAYS = 14

export type DeadlineAlert = {
  projectId: string
  projectName: string
  /** 0 = today, negative = overdue by that many days */
  daysUntil: number
  /** Outstanding contract balance if any */
  uncollected: number | null
}

function startOfLocalDay(d: Date): number {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

function parseLocalDate(yyyyMmDd: string): number | null {
  const t = Date.parse(`${yyyyMmDd}T12:00:00`)
  return Number.isFinite(t) ? t : null
}

/**
 * Active / on-hold projects with an expected end date within the window
 * (or recently overdue) get one row each; includes uncollected amount when relevant.
 */
export function buildDeadlineAlerts(
  projects: Project[],
  incomeByProjectId: Map<string, number>
): DeadlineAlert[] {
  const today = startOfLocalDay(new Date())
  const out: DeadlineAlert[] = []

  for (const p of projects) {
    if (p.status === "completed") continue
    if (!p.expectedEndDate) continue

    const end = parseLocalDate(p.expectedEndDate)
    if (end == null) continue

    const daysUntil = Math.round((end - today) / (24 * 60 * 60 * 1000))
    if (daysUntil > DEADLINE_ALERT_WINDOW_DAYS) continue

    const collected = projectCollectedTotal(
      p.collectedAmount,
      incomeByProjectId.get(p.id) ?? 0
    )
    const unc = projectUncollected(p.contractValue, collected)
    const uncollected = unc != null && unc > 0 ? unc : null

    out.push({
      projectId: p.id,
      projectName: p.name,
      daysUntil,
      uncollected,
    })
  }

  out.sort((a, b) => a.daysUntil - b.daysUntil)
  return out
}

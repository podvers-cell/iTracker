import type { Customer } from "@/lib/data/customers"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import type { Project, ProjectStatus } from "@/lib/data/projects"
import type { Transaction } from "@/lib/data/transactions"
import { normalizeDigitsToWestern } from "@/lib/format/numericInput"

export type SearchRowGroup = "nav" | "project" | "customer" | "transaction"

export type SearchRow = {
  key: string
  group: SearchRowGroup
  href: string
  primary: string
  secondary?: string
}

function norm(s: string): string {
  return normalizeDigitsToWestern(s.trim()).toLowerCase()
}

/** Every non-empty token in `query` must appear in `haystack` (after normalization). */
export function matchesSearch(haystack: string, query: string): boolean {
  const h = norm(haystack)
  const q = norm(query)
  if (!q) return true
  const tokens = q.split(/\s+/).filter(Boolean)
  return tokens.every((t) => h.includes(t))
}

function statusLabel(dict: Dictionary, s: ProjectStatus): string {
  if (s === "active") return dict.projectNew.statusActive
  if (s === "on_hold") return dict.projectNew.statusOnHold
  return dict.projectNew.statusCompleted
}

type BuildParams = {
  query: string
  projects: Project[]
  customers: Customer[]
  transactions: Transaction[]
  dict: Dictionary
}

export function buildSmartSearchRows({
  query,
  projects,
  customers,
  transactions,
  dict,
}: BuildParams): SearchRow[] {
  const q = query.trim()
  const projectNames = new Map(projects.map((p) => [p.id, p.name]))

  const sortedProjects = [...projects].sort(
    (a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0)
  )
  const sortedCustomers = [...customers].sort(
    (a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0)
  )
  const sortedTx = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
  })

  const navDefs: { href: string; title: string }[] = [
    { href: "/dashboard", title: dict.nav.dashboard },
    { href: "/projects", title: dict.nav.projects },
    { href: "/projects/new", title: dict.nav.newProject },
    { href: "/customers", title: dict.nav.customers },
    { href: "/financials", title: dict.nav.financials },
  ]

  const rows: SearchRow[] = []

  for (const n of navDefs) {
    if (!matchesSearch(n.title, q)) continue
    rows.push({
      key: `nav-${n.href}`,
      group: "nav",
      href: n.href,
      primary: n.title,
    })
  }

  const maxProj = q ? 16 : 8
  for (const p of sortedProjects) {
    if (rows.filter((r) => r.group === "project").length >= maxProj) break
    const hay =
      [p.name, p.clientName, p.location, p.id, statusLabel(dict, p.status), p.requiredScope, p.notes]
        .filter(Boolean)
        .join(" ") + ` ${p.contractValue ?? ""} ${p.expectedEndDate ?? ""} ${p.startDate ?? ""}`
    if (!matchesSearch(hay, q)) continue
    rows.push({
      key: `project-${p.id}`,
      group: "project",
      href: `/projects/${p.id}`,
      primary: p.name,
      secondary: [p.clientName, statusLabel(dict, p.status)].filter(Boolean).join(" · "),
    })
  }

  const maxCust = q ? 14 : 7
  for (const c of sortedCustomers) {
    if (rows.filter((r) => r.group === "customer").length >= maxCust) break
    const hay = [c.name, c.phone, c.notes, c.id].filter(Boolean).join(" ")
    if (!matchesSearch(hay, q)) continue
    rows.push({
      key: `customer-${c.id}`,
      group: "customer",
      href: "/customers",
      primary: c.name,
      secondary: c.phone ?? undefined,
    })
  }

  const maxTx = q ? 18 : 8
  for (const t of sortedTx) {
    if (rows.filter((r) => r.group === "transaction").length >= maxTx) break
    const pname = projectNames.get(t.projectId) ?? t.projectId
    const hay = [
      t.category,
      t.description,
      t.amount,
      t.date,
      t.type,
      pname,
      t.projectId,
    ]
      .filter((x) => x != null && x !== "")
      .join(" ")
    if (!matchesSearch(hay, q)) continue
    const typeL = t.type === "income" ? dict.transactions.income : dict.transactions.expenses
    rows.push({
      key: `tx-${t.id}`,
      group: "transaction",
      href: `/financials?projectId=${encodeURIComponent(t.projectId)}`,
      primary: `${typeL}: ${t.category}`,
      secondary: [pname, t.date, String(t.amount)].join(" · "),
    })
  }

  return rows
}

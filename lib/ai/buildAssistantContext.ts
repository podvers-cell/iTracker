import type { Project } from "@/lib/data/projects"
import type { Transaction } from "@/lib/data/transactions"
import { projectCollectedTotal } from "@/lib/data/projectFinance"

/** Room for locale labels + user message inside model input limits. */
const MAX_JSON_CHARS = 95_000

export function buildAssistantContext(opts: {
  userLabel: string
  locale: "ar" | "en"
  projects: Project[]
  transactions: Transaction[]
}) {
  const { userLabel, locale, projects, transactions } = opts

  const txByProject = new Map<string, { income: number; expense: number }>()
  for (const t of transactions) {
    const prev = txByProject.get(t.projectId) ?? { income: 0, expense: 0 }
    if (t.type === "income") prev.income += Number.isFinite(t.amount) ? t.amount : 0
    else prev.expense += Number.isFinite(t.amount) ? t.amount : 0
    txByProject.set(t.projectId, prev)
  }

  const projectIdToName = Object.fromEntries(projects.map((p) => [p.id, p.name]))

  const projectsPayload = projects.map((p) => {
    const tx = txByProject.get(p.id) ?? { income: 0, expense: 0 }
    const collected = projectCollectedTotal(p.collectedAmount, tx.income)
    const contract = typeof p.contractValue === "number" ? p.contractValue : null
    return {
      id: p.id,
      name: p.name,
      clientName: p.clientName,
      status: p.status,
      contractValueAED: contract,
      collectedTotalAED: collected,
      uncollectedAED: contract != null ? Math.max(0, contract - collected) : null,
      expensesFromTransactionsAED: tx.expense,
      netContractVsExpensesAED: contract != null ? contract - tx.expense : null,
      startDate: p.startDate,
      expectedEndDate: p.expectedEndDate,
      location: p.location,
    }
  })

  const sortedTx = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    const at = a.createdAt?.getTime() ?? 0
    const bt = b.createdAt?.getTime() ?? 0
    return bt - at
  })

  const byStatus = projects.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const income = transactions.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0)
  const expense = transactions.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0)

  const pack = (recentCount: number, projectList: typeof projectsPayload) => ({
    userLabel,
    locale,
    projectIdToName,
    counts: {
      projects: projects.length,
      incomeLines: transactions.filter((t) => t.type === "income").length,
      expenseLines: transactions.filter((t) => t.type === "expense").length,
      byStatus,
    },
    totals: {
      totalIncomeAED: income,
      totalExpensesAED: expense,
      netCashFlowAED: income - expense,
    },
    projects: projectList,
    recentTransactions: sortedTx.slice(0, recentCount).map((t) => ({
      projectId: t.projectId,
      projectName: projectIdToName[t.projectId] ?? t.projectId,
      type: t.type,
      amountAED: t.amount,
      date: t.date,
      category: t.category,
      description:
        t.description && t.description.length > 0
          ? t.description.slice(0, 160)
          : null,
    })),
  })

  type Packed = ReturnType<typeof pack>
  type Out = Packed & { dataNote?: string }

  let recent = Math.min(120, sortedTx.length)
  let plist = projectsPayload
  let out: Out = pack(recent, plist)
  let json = JSON.stringify(out)

  while (json.length > MAX_JSON_CHARS && recent > 20) {
    recent = Math.max(20, Math.floor(recent * 0.65))
    out = pack(recent, plist)
    json = JSON.stringify(out)
  }

  while (json.length > MAX_JSON_CHARS && plist.length > 1) {
    plist = plist.slice(0, Math.max(1, Math.ceil(plist.length * 0.75)))
    out = {
      ...pack(recent, plist),
      dataNote:
        locale === "ar"
          ? "قُطع جزء من قائمة المشاريع أو المعاملات ليتسع السياق."
          : "Some projects or transactions were omitted so the context fits the size limit.",
    }
    json = JSON.stringify(out)
  }

  if (json.length > MAX_JSON_CHARS) {
    out = {
      ...pack(Math.min(recent, 15), plist.slice(0, 1)),
      dataNote:
        locale === "ar"
          ? "تم تقليل البيانات بشدة بسبب الحجم. افتح صفحة المساعد للحصول على أفضل نتيجة."
          : "Context was heavily reduced due to size. Use the Assistant page for fuller data.",
    }
  }

  return out
}

export type AssistantClientContext = ReturnType<typeof buildAssistantContext>

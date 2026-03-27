"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"

import { useI18n } from "@/components/i18n/I18nProvider"
import { useAuth } from "@/components/auth/AuthProvider"
import { useProjects } from "@/components/projects/useProjects"
import { useTransactions } from "@/components/projects/useTransactions"
import { addTransaction } from "@/lib/data/transactions"
import { projectCollectedTotal, projectUncollected } from "@/lib/data/projectFinance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/ui/submit-button"
import { ProjectPicker } from "@/components/projects/ProjectPicker"
import { CollectedAtStartRow } from "@/components/projects/CollectedAtStartRow"
import { formatMoney } from "@/lib/format/money"

export default function FinancialsPage() {
  const { dict, locale } = useI18n()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const { projects, loading: projectsLoading, error: projectsError } = useProjects()
  const initialProjectId = searchParams.get("projectId") || ""
  const [projectId, setProjectId] = React.useState(initialProjectId)

  React.useEffect(() => {
    if (initialProjectId) setProjectId(initialProjectId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProjectId])

  const { transactions, loading, error, refresh } = useTransactions(projectId || "__none__")
  const expenses = React.useMemo(() => transactions.filter((t) => t.type === "expense"), [transactions])
  const incomes = React.useMemo(() => transactions.filter((t) => t.type === "income"), [transactions])

  const selectedProject = React.useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId]
  )

  const totalExpenses = React.useMemo(
    () => expenses.reduce((sum, t) => sum + (Number.isFinite(t.amount) ? t.amount : 0), 0),
    [expenses]
  )
  const totalIncomeTx = React.useMemo(
    () => incomes.reduce((sum, t) => sum + (Number.isFinite(t.amount) ? t.amount : 0), 0),
    [incomes]
  )

  const initialCollected =
    selectedProject &&
    typeof selectedProject.collectedAmount === "number" &&
    selectedProject.collectedAmount > 0
      ? selectedProject.collectedAmount
      : null

  const profitSummary = React.useMemo(() => {
    if (!selectedProject) {
      return {
        contractTotal: null as number | null,
        collected: 0,
        uncollected: null as number | null,
        contractProfit: 0,
      }
    }
    const contractTotal =
      typeof selectedProject.contractValue === "number" ? selectedProject.contractValue : null
    const collected = projectCollectedTotal(selectedProject.collectedAmount, totalIncomeTx)
    const uncollected = projectUncollected(contractTotal, collected)
    const contractProfit = (contractTotal ?? 0) - totalExpenses
    return { contractTotal, collected, uncollected, contractProfit }
  }, [selectedProject, totalIncomeTx, totalExpenses])

  const [savingExpense, setSavingExpense] = React.useState(false)
  const [savingIncome, setSavingIncome] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>, type: "expense" | "income") {
    e.preventDefault()
    const form = e.currentTarget
    if (!user) {
      setSubmitError("Not authenticated")
      return
    }
    if (!projectId) {
      setSubmitError("Project is required")
      return
    }
    if (savingExpense || savingIncome) return

    if (type === "expense") setSavingExpense(true)
    if (type === "income") setSavingIncome(true)
    setSubmitError(null)

    try {
      const fd = new FormData(form)
      const amountStr = String(fd.get("amount") || "").trim()
      const amount = Number(amountStr.replaceAll(",", "").replaceAll("٬", "").replaceAll("٫", "."))
      const category = String(fd.get("category") || "").trim()
      const description = String(fd.get("description") || "").trim()
      const date = String(fd.get("date") || "").trim()

      if (!amountStr || !Number.isFinite(amount) || amount <= 0) throw new Error("Invalid amount")
      if (!category) throw new Error("Category is required")
      if (!date) throw new Error("Date is required")

      await addTransaction({
        projectId,
        type,
        amount,
        category,
        description: description || null,
        date,
      })

      form.reset()
      await refresh()
      router.replace(`/financials?projectId=${encodeURIComponent(projectId)}`)
    } catch (err: any) {
      console.error("[financials] add failed", err)
      setSubmitError(err?.message ?? "Failed to save transaction")
    } finally {
      if (type === "expense") setSavingExpense(false)
      if (type === "income") setSavingIncome(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{dict.nav.financials}</h1>
        <p className="text-sm text-muted-foreground">{dict.projects.listTitle}</p>
      </div>

      {projectsLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : projectsError ? (
        <div className="text-sm text-destructive">{projectsError}</div>
      ) : (
        <ProjectPicker
          projects={projects}
          value={projectId}
          onChange={(id) => setProjectId(id)}
          label={dict.projects.title}
        />
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{dict.projectDetails.summary}</CardTitle>
        </CardHeader>
        <CardContent>
          {!projectId ? (
            <div className="text-sm text-muted-foreground">{dict.projects.emptyBody}</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="rounded-lg border bg-card px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  {dict.projectDetails.summaryContractTotal}
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {profitSummary.contractTotal != null
                    ? formatMoney(profitSummary.contractTotal, locale)
                    : dict.projectDetails.notAvailable}
                </div>
              </div>
              <div className="rounded-lg border bg-card px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  {dict.projectDetails.summaryCollected}
                </div>
                <div className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-500">
                  {formatMoney(profitSummary.collected, locale)}
                </div>
              </div>
              <div className="rounded-lg border bg-card px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  {dict.projectDetails.summaryUncollected}
                </div>
                <div className="mt-1 text-lg font-semibold text-amber-700 dark:text-amber-500">
                  {profitSummary.uncollected != null
                    ? formatMoney(profitSummary.uncollected, locale)
                    : dict.projectDetails.notAvailable}
                </div>
              </div>
              <div className="rounded-lg border bg-card px-4 py-3">
                <div className="text-sm text-muted-foreground">{dict.transactions.totalExpenses}</div>
                <div className="mt-1 text-lg font-semibold text-rose-700 dark:text-rose-400">
                  {formatMoney(totalExpenses, locale)}
                </div>
              </div>
              <div className="rounded-lg border bg-card px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  {dict.projectDetails.summaryNetProfitContract}
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {formatMoney(profitSummary.contractProfit, locale)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{dict.transactions.addExpense}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void onSubmit(e, "expense")}>
              <div className="space-y-2">
                <Label htmlFor="expense-amount">{dict.transactions.amount}</Label>
                <Input id="expense-amount" name="amount" inputMode="decimal" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-category">{dict.transactions.category}</Label>
                <Input id="expense-category" name="category" placeholder={dict.transactions.category} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-description">{dict.transactions.description}</Label>
                <Input
                  id="expense-description"
                  name="description"
                  placeholder={dict.transactions.description}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-date">{dict.transactions.date}</Label>
                <Input id="expense-date" name="date" type="date" />
              </div>
              <SubmitButton className="h-11 w-full text-base" disabled={savingExpense}>
                {savingExpense ? dict.transactions.saving : dict.transactions.save}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{dict.transactions.addIncome}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void onSubmit(e, "income")}>
              <div className="space-y-2">
                <Label htmlFor="income-amount">{dict.transactions.amount}</Label>
                <Input id="income-amount" name="amount" inputMode="decimal" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income-category">{dict.transactions.category}</Label>
                <Input id="income-category" name="category" placeholder={dict.transactions.category} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income-description">{dict.transactions.description}</Label>
                <Input id="income-description" name="description" placeholder={dict.transactions.description} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income-date">{dict.transactions.date}</Label>
                <Input id="income-date" name="date" type="date" />
              </div>
              <SubmitButton className="h-11 w-full text-base" disabled={savingIncome}>
                {savingIncome ? dict.transactions.saving : dict.transactions.save}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>

      {submitError ? <div className="text-sm text-destructive">{submitError}</div> : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{dict.transactions.expenses}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!projectId ? (
              <div className="text-sm text-muted-foreground">{dict.projects.emptyBody}</div>
            ) : loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : expenses.length === 0 ? (
              <div className="space-y-1">
                <div className="font-medium">{dict.transactions.emptyTitle}</div>
                <div className="text-sm text-muted-foreground">{dict.transactions.emptyBody}</div>
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {expenses.map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-3 px-3 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{t.category}</div>
                      {t.description ? (
                        <div className="mt-1 text-sm text-muted-foreground">{t.description}</div>
                      ) : null}
                      <div className="mt-1 text-xs text-muted-foreground">{t.date}</div>
                    </div>
                    <div className="shrink-0 text-sm font-semibold text-rose-700 dark:text-rose-400">
                      {formatMoney(t.amount, locale)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{dict.transactions.income}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!projectId ? (
              <div className="text-sm text-muted-foreground">{dict.projects.emptyBody}</div>
            ) : loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : initialCollected == null && incomes.length === 0 ? (
              <div className="space-y-1">
                <div className="font-medium">{dict.transactions.emptyTitle}</div>
                <div className="text-sm text-muted-foreground">{dict.transactions.emptyBody}</div>
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {initialCollected != null && selectedProject ? (
                  <CollectedAtStartRow amount={initialCollected} startDate={selectedProject.startDate} />
                ) : null}
                {incomes.map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-3 px-3 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{t.category}</div>
                      {t.description ? (
                        <div className="mt-1 text-sm text-muted-foreground">{t.description}</div>
                      ) : null}
                      <div className="mt-1 text-xs text-muted-foreground">{t.date}</div>
                    </div>
                    <div className="shrink-0 text-sm font-semibold text-emerald-700 dark:text-emerald-500">
                      {formatMoney(t.amount, locale)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

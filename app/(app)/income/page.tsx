"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"

import { useI18n } from "@/components/i18n/I18nProvider"
import { useAuth } from "@/components/auth/AuthProvider"
import { useProjects } from "@/components/projects/useProjects"
import { useTransactions } from "@/components/projects/useTransactions"
import { addTransaction } from "@/lib/data/transactions"
import { projectCollectedTotal } from "@/lib/data/projectFinance"
import { CollectedAtStartRow } from "@/components/projects/CollectedAtStartRow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/ui/submit-button"
import { ProjectPicker } from "@/components/projects/ProjectPicker"
import { formatMoney } from "@/lib/format/money"

export default function IncomePage() {
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
  const selectedProject = React.useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId]
  )
  const incomes = React.useMemo(
    () => transactions.filter((t) => t.type === "income"),
    [transactions]
  )

  const incomeTxSum = React.useMemo(
    () => incomes.reduce((sum, t) => sum + (Number.isFinite(t.amount) ? t.amount : 0), 0),
    [incomes]
  )

  const total = React.useMemo(
    () => projectCollectedTotal(selectedProject?.collectedAmount, incomeTxSum),
    [selectedProject, incomeTxSum]
  )

  const initialCollected =
    selectedProject &&
    typeof selectedProject.collectedAmount === "number" &&
    selectedProject.collectedAmount > 0
      ? selectedProject.collectedAmount
      : null

  const [saving, setSaving] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    if (saving) return

    setSaving(true)
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
        type: "income",
        amount,
        category,
        description: description || null,
        date,
      })

      form.reset()
      await refresh()
      router.replace(`/income?projectId=${encodeURIComponent(projectId)}`)
    } catch (err: any) {
      console.error("[income] add failed", err)
      setSubmitError(err?.message ?? "Failed to add income")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{dict.nav.incomes}</h1>
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
          <CardTitle className="text-base">{dict.transactions.totalIncome}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{formatMoney(total, locale)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{dict.transactions.addIncome}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="amount">{dict.transactions.amount}</Label>
              <Input id="amount" name="amount" inputMode="decimal" placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{dict.transactions.category}</Label>
              <Input id="category" name="category" placeholder={dict.transactions.category} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{dict.transactions.description}</Label>
              <Input id="description" name="description" placeholder={dict.transactions.description} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">{dict.transactions.date}</Label>
              <Input id="date" name="date" type="date" />
            </div>
            <SubmitButton className="h-11 w-full text-base" disabled={saving}>
              {saving ? dict.transactions.saving : dict.transactions.save}
            </SubmitButton>
            {submitError ? <div className="text-sm text-destructive">{submitError}</div> : null}
          </form>
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
                  <div className="shrink-0 text-sm font-semibold">{formatMoney(t.amount, locale)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


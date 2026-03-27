"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { useI18n } from "@/components/i18n/I18nProvider"
import { useAuth } from "@/components/auth/AuthProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/link-button"
import { getProjectById, updateProjectStatus, type ProjectStatus } from "@/lib/data/projects"
import { projectCollectedTotal, projectUncollected } from "@/lib/data/projectFinance"
import { useTransactions } from "@/components/projects/useTransactions"
import { CollectedAtStartRow } from "@/components/projects/CollectedAtStartRow"
import { formatMoney } from "@/lib/format/money"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const MD_UP_QUERY = "(min-width: 768px)"

function MobileCollapsibleCardTitle({
  title,
  expanded,
  mdUp,
  onToggleMobile,
}: {
  title: React.ReactNode
  expanded: boolean
  mdUp: boolean
  onToggleMobile: () => void
}) {
  return (
    <CardHeader
      className={cn("pb-3", !mdUp && "cursor-pointer rounded-t-xl active:bg-muted/40")}
      onClick={() => {
        if (!mdUp) onToggleMobile()
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <CardTitle className="min-w-0 flex-1 text-base">{title}</CardTitle>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform duration-200 md:hidden",
            expanded ? "rotate-180" : ""
          )}
        />
      </div>
    </CardHeader>
  )
}

function MobileCollapsibleCard({
  title,
  defaultOpen = false,
  children,
}: {
  title: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [mdUp, setMdUp] = React.useState(false)
  const [open, setOpen] = React.useState(defaultOpen)

  React.useEffect(() => {
    const mq = window.matchMedia(MD_UP_QUERY)
    setMdUp(mq.matches)
    const onChange = () => setMdUp(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const expanded = mdUp || open

  return (
    <Card className="overflow-hidden">
      <MobileCollapsibleCardTitle
        title={title}
        expanded={open}
        mdUp={mdUp}
        onToggleMobile={() => setOpen((v) => !v)}
      />
      <CardContent className={cn(!expanded && "max-md:hidden")}>{children}</CardContent>
    </Card>
  )
}

export default function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }> | { projectId: string }
}) {
  const { dict, locale } = useI18n()
  const { user } = useAuth()
  // Next.js in this repo passes `params` as a Promise in some modes.
  const { projectId } = React.use(params as any) as { projectId: string }

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [project, setProject] = React.useState<Awaited<ReturnType<typeof getProjectById>>>(null)
  const { transactions, loading: txLoading, error: txError } = useTransactions(projectId)
  const [statusSaving, setStatusSaving] = React.useState(false)
  const [statusError, setStatusError] = React.useState<string | null>(null)

  const totalExpenses = React.useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (Number.isFinite(t.amount) ? t.amount : 0), 0)
  }, [transactions])

  const totalIncomeTx = React.useMemo(() => {
    return transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (Number.isFinite(t.amount) ? t.amount : 0), 0)
  }, [transactions])

  const expensesList = React.useMemo(
    () => transactions.filter((t) => t.type === "expense"),
    [transactions]
  )
  const incomesList = React.useMemo(
    () => transactions.filter((t) => t.type === "income"),
    [transactions]
  )

  const initialCollected =
    project &&
    typeof project.collectedAmount === "number" &&
    project.collectedAmount > 0
      ? project.collectedAmount
      : null

  const profitSummary = React.useMemo(() => {
    if (!project) {
      return {
        contractTotal: null as number | null,
        collected: 0,
        uncollected: null as number | null,
        contractProfit: 0,
      }
    }
    const contractTotal =
      typeof project.contractValue === "number" ? project.contractValue : null
    const collected = projectCollectedTotal(project.collectedAmount, totalIncomeTx)
    const uncollected = projectUncollected(contractTotal, collected)
    const contractProfit = (contractTotal ?? 0) - totalExpenses
    return { contractTotal, collected, uncollected, contractProfit }
  }, [project, totalIncomeTx, totalExpenses])

  function calculateProjectDuration(startDate: string | null, endDate: string | null) {
    if (!startDate || !endDate) return null
    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
    const diffMs = end.getTime() - start.getTime()
    if (diffMs < 0) return null
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
    if (locale === "ar") return `${days} ${dict.projectDetails.daysUnitAr}`
    return `${days} ${days === 1 ? dict.projectDetails.dayUnitEn : dict.projectDetails.daysUnitEn}`
  }

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getProjectById(projectId)
      .then((p) => {
        if (cancelled) return
        setProject(p)
      })
      .catch((e: any) => {
        if (cancelled) return
        setError(e?.message ?? "Failed to load project")
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{dict.projectDetails.title}</h1>
          </div>
          <LinkButton href="/projects" variant="outline" className="h-11 text-base">
            {dict.projectDetails.viewAll}
          </LinkButton>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{dict.projectDetails.notFoundTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{dict.projectDetails.notFoundBody}</p>
            <LinkButton href="/projects" className="h-11 text-base">
              {dict.projectDetails.viewAll}
            </LinkButton>
          </CardContent>
        </Card>
      </div>
    )
  }

  const projectDuration = calculateProjectDuration(project.startDate, project.expectedEndDate)
  const projectRow = project

  function statusLabel(s: ProjectStatus) {
    if (s === "active") return dict.projectNew.statusActive
    if (s === "on_hold") return dict.projectNew.statusOnHold
    return dict.projectNew.statusCompleted
  }

  async function handleStatusChange(next: ProjectStatus) {
    if (!user || next === projectRow.status) return
    setStatusError(null)
    setStatusSaving(true)
    const prev = projectRow.status
    setProject((p) => (p ? { ...p, status: next } : p))
    try {
      await updateProjectStatus(projectId, next)
    } catch (e: unknown) {
      setProject((p) => (p ? { ...p, status: prev } : p))
      const msg =
        e instanceof Error ? e.message : dict.projectDetails.statusUpdateFailed
      setStatusError(msg)
    } finally {
      setStatusSaving(false)
    }
  }

  function DetailTile({
    label,
    value,
    valueClassName,
  }: {
    label: string
    value: React.ReactNode
    valueClassName?: string
  }) {
    return (
      <div className="rounded-lg border border-border/60 bg-card px-4 py-3 shadow-sm">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div
          className={
            valueClassName ??
            "mt-1 text-lg font-semibold text-foreground break-words"
          }
        >
          {value}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          {project.clientName ? (
            <p className="text-sm text-muted-foreground">
              {dict.projects.client}: {project.clientName}
            </p>
          ) : null}
        </div>
        <LinkButton href="/projects" variant="outline" className="h-11 text-base">
          {dict.projectDetails.viewAll}
        </LinkButton>
      </div>

      <MobileCollapsibleCard title={dict.projectDetails.summary}>
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
            <div className="mt-1 text-lg font-semibold">{formatMoney(profitSummary.contractProfit, locale)}</div>
          </div>
        </div>
      </MobileCollapsibleCard>

      <MobileCollapsibleCard title={dict.projectDetails.title}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailTile
              label={dict.projectDetails.contractValue}
              value={
                typeof project.contractValue === "number"
                  ? formatMoney(project.contractValue, locale)
                  : dict.projectDetails.notAvailable
              }
            />
            <DetailTile
              label={dict.projectDetails.duration}
              value={projectDuration ?? dict.projectDetails.notAvailable}
            />
            <div className="rounded-lg border border-border/60 bg-card px-4 py-3 shadow-sm">
              <div className="text-sm text-muted-foreground">{dict.projectDetails.status}</div>
              <p className="sr-only">{dict.projectDetails.statusChangeHint}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["active", "on_hold", "completed"] as const).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={project.status === s ? "default" : "outline"}
                    size="sm"
                    className="h-10 shrink-0 rounded-xl text-sm"
                    disabled={statusSaving || !user}
                    onClick={() => void handleStatusChange(s)}
                  >
                    {statusLabel(s)}
                  </Button>
                ))}
              </div>
              {statusError ? (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {statusError}
                </p>
              ) : null}
            </div>
            <DetailTile
              label={dict.projectDetails.location}
              value={project.location ?? dict.projectDetails.notAvailable}
            />
            <DetailTile
              label={dict.projectDetails.startDate}
              value={project.startDate ?? dict.projectDetails.notAvailable}
            />
            <DetailTile
              label={dict.projectDetails.expectedEndDate}
              value={project.expectedEndDate ?? dict.projectDetails.notAvailable}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailTile
              label={dict.projectDetails.requiredScope}
              value={project.requiredScope ?? dict.projectDetails.notAvailable}
              valueClassName="mt-1 text-base font-medium leading-relaxed text-foreground whitespace-pre-wrap break-words"
            />
            <DetailTile
              label={dict.projectDetails.notes}
              value={project.notes ?? dict.projectDetails.notAvailable}
              valueClassName="mt-1 text-base font-medium leading-relaxed text-foreground whitespace-pre-wrap break-words"
            />
          </div>
        </div>
      </MobileCollapsibleCard>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <MobileCollapsibleCard title={dict.projectDetails.expenseDetails}>
          <div className="space-y-3">
            {txLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : txError ? (
              <div className="text-sm text-destructive">{txError}</div>
            ) : expensesList.length === 0 ? (
              <div className="space-y-1">
                <div className="font-medium">{dict.transactions.emptyTitle}</div>
                <div className="text-sm text-muted-foreground">{dict.transactions.emptyBody}</div>
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {expensesList.map((t) => (
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
          </div>
        </MobileCollapsibleCard>

        <MobileCollapsibleCard title={dict.projectDetails.incomeDetails}>
          <div className="space-y-3">
            {txLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : txError ? (
              <div className="text-sm text-destructive">{txError}</div>
            ) : initialCollected == null && incomesList.length === 0 ? (
              <div className="space-y-1">
                <div className="font-medium">{dict.transactions.emptyTitle}</div>
                <div className="text-sm text-muted-foreground">{dict.transactions.emptyBody}</div>
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {initialCollected != null && project ? (
                  <CollectedAtStartRow amount={initialCollected} startDate={project.startDate} />
                ) : null}
                {incomesList.map((t) => (
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
          </div>
        </MobileCollapsibleCard>
      </div>

      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{dict.projectDetails.financialsOnlyHint}</p>
          <LinkButton
            href={`/financials?projectId=${encodeURIComponent(projectId)}`}
            className="h-11 shrink-0 text-base"
          >
            {dict.projectDetails.openFinancials}
          </LinkButton>
        </CardContent>
      </Card>
    </div>
  )
}


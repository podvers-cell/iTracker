"use client"

import * as React from "react"
import Image from "next/image"
import type { LucideIcon } from "lucide-react"
import {
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Clock3,
  House,
  PauseCircle,
  Wallet,
  ArrowDownCircle,
  HandCoins,
} from "lucide-react"

import { useI18n } from "@/components/i18n/I18nProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/link-button"
import { useProjects } from "@/components/projects/useProjects"
import { useAllTransactions } from "@/components/projects/useAllTransactions"
import { Money } from "@/components/ui/money"
import { projectCollectedTotal } from "@/lib/data/projectFinance"
import { normalizeCalendarDateString, toISODateLocal } from "@/lib/dates/localDate"
import { cn } from "@/lib/utils"

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0)
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function parseLocalYmd(dateStr: string) {
  const core = normalizeCalendarDateString(dateStr)
  const parts = core.split("-")
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  return new Date(y, m - 1, d)
}

/** Calendar day to attribute “collected at project start” for cash-flow rows. */
function collectedAtStartDayKey(p: { startDate: string | null; createdAt: Date | null }): string | null {
  if (p.startDate?.trim()) {
    return normalizeCalendarDateString(p.startDate)
  }
  if (p.createdAt) {
    return toISODateLocal(p.createdAt)
  }
  return null
}

type CashFlowGranularity = "month" | "quarter" | "year"

const CASH_FLOW_MONTH_COUNT = 12
const CASH_FLOW_QUARTER_COUNT = 8
const CASH_FLOW_YEAR_COUNT = 5

/** Do not list periods before this month (inclusive). Matches reporting start March 2026. */
const CASH_FLOW_EARLIEST_YEAR = 2026
const CASH_FLOW_EARLIEST_MONTH = 3

function compareYearMonth(y1: number, m1: number, y2: number, m2: number): number {
  if (y1 !== y2) return y1 - y2
  return m1 - m2
}

function quarterEndDate(y: number, q: 1 | 2 | 3 | 4): Date {
  const d = new Date(y, q * 3, 0)
  d.setHours(0, 0, 0, 0)
  return d
}

const cashFlowEarliestMonthStart = new Date(
  CASH_FLOW_EARLIEST_YEAR,
  CASH_FLOW_EARLIEST_MONTH - 1,
  1
)
cashFlowEarliestMonthStart.setHours(0, 0, 0, 0)

function monthKeysFlooredRolling(anchor: Date, n: number): string[] {
  const endY = anchor.getFullYear()
  const endM = anchor.getMonth() + 1
  if (compareYearMonth(endY, endM, CASH_FLOW_EARLIEST_YEAR, CASH_FLOW_EARLIEST_MONTH) < 0) {
    return []
  }
  let startY = endY
  let startM = endM
  for (let step = 0; step < n - 1; step++) {
    startM -= 1
    if (startM < 1) {
      startM = 12
      startY -= 1
    }
  }
  if (compareYearMonth(startY, startM, CASH_FLOW_EARLIEST_YEAR, CASH_FLOW_EARLIEST_MONTH) < 0) {
    startY = CASH_FLOW_EARLIEST_YEAR
    startM = CASH_FLOW_EARLIEST_MONTH
  }
  if (compareYearMonth(endY, endM, startY, startM) < 0) return []

  const keys: string[] = []
  let cy = startY
  let cm = startM
  while (compareYearMonth(cy, cm, endY, endM) <= 0) {
    keys.push(`${cy}-${String(cm).padStart(2, "0")}`)
    cm += 1
    if (cm > 12) {
      cm = 1
      cy += 1
    }
  }
  return keys
}

function quarterKeysFlooredFromAnchor(anchor: Date, maxCount: number): string[] {
  let cy = anchor.getFullYear()
  let cq = Math.floor(anchor.getMonth() / 3) + 1
  const keys: string[] = []
  for (let i = 0; i < maxCount; i++) {
    const q = cq as 1 | 2 | 3 | 4
    const end = quarterEndDate(cy, q)
    if (end < cashFlowEarliestMonthStart) break
    keys.unshift(`${cy}-Q${cq}`)
    cq -= 1
    if (cq < 1) {
      cq = 4
      cy -= 1
    }
  }
  return keys
}

function yearKeysFlooredFromAnchor(anchor: Date, count: number): string[] {
  const endY = anchor.getFullYear()
  if (endY < CASH_FLOW_EARLIEST_YEAR) return []
  const startY = Math.max(CASH_FLOW_EARLIEST_YEAR, endY - (count - 1))
  return Array.from({ length: endY - startY + 1 }, (_, i) => String(startY + i))
}

function ymdPartsFromIso(iso: string): { y: number; m: number } | null {
  const n = normalizeCalendarDateString(iso)
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(n)
  if (!m) return null
  return { y: Number(m[1]), m: Number(m[2]) }
}

function bucketKeyFromYmd(y: number, month: number, mode: CashFlowGranularity): string {
  if (mode === "year") return String(y)
  if (mode === "month") return `${y}-${String(month).padStart(2, "0")}`
  const q = Math.floor((month - 1) / 3) + 1
  return `${y}-Q${q}`
}

function bucketKeyFromIso(iso: string, mode: CashFlowGranularity): string | null {
  const ymd = ymdPartsFromIso(iso)
  if (!ymd) return null
  return bucketKeyFromYmd(ymd.y, ymd.m, mode)
}

function periodKeysForGranularity(mode: CashFlowGranularity, anchor: Date): string[] {
  if (mode === "year") {
    return yearKeysFlooredFromAnchor(anchor, CASH_FLOW_YEAR_COUNT)
  }
  if (mode === "month") {
    return monthKeysFlooredRolling(anchor, CASH_FLOW_MONTH_COUNT)
  }
  return quarterKeysFlooredFromAnchor(anchor, CASH_FLOW_QUARTER_COUNT)
}

function formatCashFlowPeriodLabel(key: string, mode: CashFlowGranularity, locale: string): string {
  if (mode === "year") return key
  if (mode === "month") {
    const parts = key.split("-")
    const yi = Number(parts[0])
    const mi = Number(parts[1])
    if (!Number.isFinite(yi) || !Number.isFinite(mi)) return key
    const d = new Date(yi, mi - 1, 1)
    return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      month: "short",
      year: "numeric",
    }).format(d)
  }
  const mq = /^(\d{4})-Q([1-4])$/.exec(key)
  if (!mq) return key
  if (locale === "ar") {
    return `${mq[1]} ر${mq[2]}`
  }
  return `${mq[1]} Q${mq[2]}`
}

function formatCashFlowRangeLine(
  keys: string[],
  mode: CashFlowGranularity,
  locale: string
): string {
  if (keys.length === 0) return ""
  const a = formatCashFlowPeriodLabel(keys[0], mode, locale)
  const b = formatCashFlowPeriodLabel(keys[keys.length - 1], mode, locale)
  return `${a} — ${b}`
}

type StatTone = "sky" | "amber" | "emerald" | "rose" | "violet" | "red"

const STAT_TONE: Record<
  StatTone,
  { card: string; icon: string; title: string; value: string }
> = {
  sky: {
    card:
      "border-sky-200/70 bg-sky-50/95 bg-gradient-to-br from-sky-50 to-sky-100/40 max-md:border-0 max-md:from-sky-50/90 max-md:to-sky-100/30 max-md:shadow-[0_8px_28px_rgba(14,165,233,0.16)]",
    icon: "bg-sky-100 text-sky-700",
    title: "text-sky-900/70",
    value: "text-sky-950",
  },
  amber: {
    card:
      "border-amber-200/70 bg-amber-50/95 bg-gradient-to-br from-amber-50 to-amber-100/40 max-md:border-0 max-md:from-amber-50/90 max-md:to-amber-100/30 max-md:shadow-[0_8px_28px_rgba(245,158,11,0.16)]",
    icon: "bg-amber-100 text-amber-700",
    title: "text-amber-900/70",
    value: "text-amber-950",
  },
  emerald: {
    card:
      "border-emerald-200/70 bg-emerald-50/95 bg-gradient-to-br from-emerald-50 to-emerald-100/40 max-md:border-0 max-md:from-emerald-50/90 max-md:to-emerald-100/30 max-md:shadow-[0_8px_28px_rgba(16,185,129,0.16)]",
    icon: "bg-emerald-100 text-emerald-700",
    title: "text-emerald-900/70",
    value: "text-emerald-950",
  },
  rose: {
    card:
      "border-rose-200/70 bg-rose-50/95 bg-gradient-to-br from-rose-50 to-rose-100/40 max-md:border-0 max-md:from-rose-50/90 max-md:to-rose-100/30 max-md:shadow-[0_8px_28px_rgba(244,63,94,0.14)]",
    icon: "bg-rose-100 text-rose-700",
    title: "text-rose-900/70",
    value: "text-rose-950",
  },
  violet: {
    card:
      "border-violet-200/70 bg-violet-50/95 bg-gradient-to-br from-violet-50 to-violet-100/40 max-md:border-0 max-md:from-violet-50/90 max-md:to-violet-100/30 max-md:shadow-[0_8px_28px_rgba(139,92,246,0.16)]",
    icon: "bg-violet-100 text-violet-700",
    title: "text-violet-900/70",
    value: "text-violet-950",
  },
  red: {
    card:
      "border-red-200/70 bg-red-50/95 bg-gradient-to-br from-red-50 to-red-100/40 max-md:border-0 max-md:from-red-50/90 max-md:to-red-100/30 max-md:shadow-[0_8px_28px_rgba(239,68,68,0.14)]",
    icon: "bg-red-100 text-red-700",
    title: "text-red-900/70",
    value: "text-red-950",
  },
}

type StatCardProps = {
  title: string
  value: React.ReactNode
  icon: LucideIcon
  tone: StatTone
  className?: string
}

function StatCard({ title, value, icon: Icon, tone, className }: StatCardProps) {
  const t = STAT_TONE[tone]
  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-3 md:contents">
      <Card className={cn(t.card, "w-full max-md:rounded-2xl md:shadow-sm", className)}>
        {/* Mobile: icon + value only; label sits under the card */}
        <div className="flex flex-col items-center gap-2 px-0.5 py-3 text-center md:hidden">
          <div
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
              t.icon
            )}
          >
            <Icon className="size-[1.35rem]" strokeWidth={2} />
          </div>
          <p
            className={cn(
              "max-w-full break-words text-lg font-bold tabular-nums leading-tight tracking-tight",
              t.value
            )}
          >
            {value}
          </p>
        </div>

        {/* md+: classic row layout */}
        <div className="hidden md:block">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className={cn("text-sm font-medium", t.title)}>{title}</CardTitle>
              <div className={cn("grid size-9 place-items-center rounded-xl", t.icon)}>
                <Icon className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn("stat-number", t.value)}>{value}</div>
          </CardContent>
        </div>
      </Card>
      <p
        className={cn(
          "line-clamp-2 w-full px-0.5 text-center text-[10px] font-semibold leading-tight md:hidden",
          t.title
        )}
      >
        {title}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const { dict, locale } = useI18n()
  const { projects, loading, error } = useProjects()
  const {
    transactions,
    loading: txLoading,
    error: txError,
  } = useAllTransactions()

  const now = new Date()
  const cashFlowCalendarMonthKey = `${now.getFullYear()}-${now.getMonth()}`
  const [cashFlowGranularity, setCashFlowGranularity] = React.useState<CashFlowGranularity>("month")

  const totalProjects = projects.length
  const activeCount = projects.filter((p) => p.status === "active").length
  const completedCount = projects.filter((p) => p.status === "completed").length
  const onHoldCount = projects.filter((p) => p.status === "on_hold").length

  const totalExpenses = sum(transactions.filter((t) => t.type === "expense").map((t) => t.amount))
  const totalContract = sum(
    projects.map((p) => (typeof p.contractValue === "number" ? p.contractValue : 0))
  )
  const netProfit = totalContract - totalExpenses

  const txIncomeByProject = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      if (t.type !== "income") continue
      const a = Number.isFinite(t.amount) ? t.amount : 0
      map.set(t.projectId, (map.get(t.projectId) ?? 0) + a)
    }
    return map
  }, [transactions])

  const paid = projects.reduce(
    (sum, p) => sum + projectCollectedTotal(p.collectedAmount, txIncomeByProject.get(p.id) ?? 0),
    0
  )
  const unpaid = Math.max(0, totalContract - paid)

  const monthStart = startOfMonth(now)
  const todayDay = now.getDate()
  const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
  const compareThroughDay = Math.min(todayDay, lastDayPrevMonth)
  const prevMonthSliceEnd = new Date(now.getFullYear(), now.getMonth() - 1, compareThroughDay)

  const inMonthThroughDay = (dateStr: string, monthStartDate: Date, throughDay: Date) => {
    const t = parseLocalYmd(dateStr)
    return t >= monthStartDate && t <= throughDay
  }

  const periodProfit = transactions.reduce((acc, t) => {
    if (!inMonthThroughDay(t.date, monthStart, now)) return acc
    return acc + (t.type === "income" ? t.amount : -t.amount)
  }, 0)

  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevProfit = transactions.reduce((acc, t) => {
    if (!inMonthThroughDay(t.date, prevMonthStart, prevMonthSliceEnd)) return acc
    return acc + (t.type === "income" ? t.amount : -t.amount)
  }, 0)

  const growthPercent =
    prevProfit === 0 ? null : ((periodProfit - prevProfit) / Math.abs(prevProfit)) * 100

  const growthDisplay = (() => {
    if (periodProfit === 0 && prevProfit === 0) return "—"
    if (prevProfit === 0) {
      if (periodProfit === 0) return "—"
      return (
        <span className="inline-flex items-center gap-0.5">
          +<Money amount={periodProfit} locale={locale} />
        </span>
      )
    }
    const pct = growthPercent ?? 0
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
  })()

  const cashFlowPeriodKeys = React.useMemo(() => {
    const anchor = new Date()
    anchor.setHours(0, 0, 0, 0)
    return periodKeysForGranularity(cashFlowGranularity, anchor)
  }, [cashFlowCalendarMonthKey, cashFlowGranularity])

  const cashFlowRangeLabel = React.useMemo(
    () => formatCashFlowRangeLine(cashFlowPeriodKeys, cashFlowGranularity, locale),
    [cashFlowPeriodKeys, cashFlowGranularity, locale]
  )

  const { series, monthMtdIncome, monthMtdExpense, monthMtdNet, runningEnd, cashFlowHasActivity } =
    React.useMemo(() => {
      const periodSet = new Set(cashFlowPeriodKeys)
      const byBucket = new Map<string, { income: number; expense: number }>()
      for (const pk of cashFlowPeriodKeys) {
        byBucket.set(pk, { income: 0, expense: 0 })
      }
      for (const t of transactions) {
        const bk = bucketKeyFromIso(t.date, cashFlowGranularity)
        if (!bk || !periodSet.has(bk)) continue
        const cell = byBucket.get(bk)
        if (!cell) continue
        if (t.type === "income") cell.income += t.amount
        else cell.expense += t.amount
      }
      for (const p of projects) {
        const amt = typeof p.collectedAmount === "number" ? p.collectedAmount : 0
        if (amt <= 0) continue
        const dk = collectedAtStartDayKey(p)
        if (!dk) continue
        const bk = bucketKeyFromIso(dk, cashFlowGranularity)
        if (!bk || !periodSet.has(bk)) continue
        const cell = byBucket.get(bk)
        if (!cell) continue
        cell.income += amt
      }
      let cumulativeRun = 0
      const seriesInner = cashFlowPeriodKeys.map((pk) => {
        const { income, expense } = byBucket.get(pk) ?? { income: 0, expense: 0 }
        const profit = income - expense
        cumulativeRun += profit
        return {
          periodKey: pk,
          label: formatCashFlowPeriodLabel(pk, cashFlowGranularity, locale),
          income,
          expense,
          profit,
          cumulative: cumulativeRun,
        }
      })
      const inc = seriesInner.reduce((s, d) => s + d.income, 0)
      const exp = seriesInner.reduce((s, d) => s + d.expense, 0)
      return {
        series: seriesInner,
        monthMtdIncome: inc,
        monthMtdExpense: exp,
        monthMtdNet: inc - exp,
        runningEnd: seriesInner.length ? seriesInner[seriesInner.length - 1].cumulative : 0,
        cashFlowHasActivity: inc > 0 || exp > 0,
      }
    }, [cashFlowPeriodKeys, transactions, projects, cashFlowGranularity, locale])

  const displaySeries = React.useMemo(
    () =>
      [...series]
        .reverse()
        .filter((r) => r.income !== 0 || r.expense !== 0),
    [series]
  )

  return (
    <div className="space-y-6 max-md:space-y-5">
      <header
        className={cn(
          "relative h-36 overflow-hidden rounded-[2rem] border border-border/50 shadow-[0_8px_28px_rgba(91,33,182,0.1)] sm:h-40 sm:rounded-[2.25rem] md:h-48 md:rounded-[2.5rem] md:border-border/60 md:shadow-none",
          /* Float over header wave (margin must use a plain length so Tailwind always emits it). */
          "max-md:relative max-md:z-20 max-md:-mt-[length:var(--mobile-hero-overlap)] max-md:border-0 max-md:shadow-[0_20px_48px_-18px_rgba(76,29,149,0.35)]"
        )}
      >
        <Image
          src="/images/hero-header.png"
          alt=""
          fill
          priority
          quality={100}
          unoptimized
          sizes="100vw"
          className="object-cover object-left sm:object-[28%_center]"
        />
      </header>

      <div className="space-y-1 max-md:pt-1">
        <h1 className="flex items-center gap-2 page-title max-md:text-xl max-md:font-bold max-md:tracking-tight max-md:text-violet-950 max-md:[text-shadow:none]">
          <House className="size-7 shrink-0 text-violet-600 max-md:text-violet-600" strokeWidth={2.25} aria-hidden />
          {dict.dashboard.title}
        </h1>
        <p className="page-subtitle max-md:text-zinc-500">{dict.dashboard.overview}</p>
      </div>

      {loading || txLoading ? (
        <p role="status" className="text-sm text-muted-foreground" aria-live="polite">
          {dict.dashboard.loadingDashboard}
        </p>
      ) : null}

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
        <StatCard
          title={dict.dashboard.totalProjects}
          value={loading ? "…" : totalProjects}
          icon={Briefcase}
          tone="sky"
        />
        <StatCard
          title={dict.dashboard.active}
          value={loading ? "…" : activeCount}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          title={dict.dashboard.completed}
          value={loading ? "…" : completedCount}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          title={dict.dashboard.onHold}
          value={loading ? "…" : onHoldCount}
          icon={PauseCircle}
          tone="rose"
        />
        <StatCard
          title={dict.dashboard.totalContracts}
          value={
            loading ? (
              <span className="inline-block h-7 min-w-[4.5rem] animate-pulse rounded-md bg-muted/80" aria-hidden />
            ) : (
              <Money amount={totalContract} locale={locale} />
            )
          }
          icon={ClipboardList}
          tone="violet"
        />
        <StatCard
          title={dict.dashboard.totalIncome}
          value={
            loading || txLoading ? (
              <span className="inline-block h-7 min-w-[4.5rem] animate-pulse rounded-md bg-muted/80" aria-hidden />
            ) : (
              <Money amount={paid} locale={locale} />
            )
          }
          icon={Wallet}
          tone="emerald"
        />
        <StatCard
          title={dict.dashboard.totalExpenses}
          value={
            txLoading ? (
              <span className="inline-block h-7 min-w-[4.5rem] animate-pulse rounded-md bg-muted/80" aria-hidden />
            ) : (
              <Money amount={totalExpenses} locale={locale} />
            )
          }
          icon={ArrowDownCircle}
          tone="red"
        />
        <StatCard
          title={dict.dashboard.netProfit}
          value={
            loading || txLoading ? (
              <span className="inline-block h-7 min-w-[4.5rem] animate-pulse rounded-md bg-muted/80" aria-hidden />
            ) : (
              <Money amount={netProfit} locale={locale} />
            )
          }
          icon={HandCoins}
          tone={netProfit >= 0 ? "emerald" : "red"}
        />
      </div>

      <Card
        className="max-md:rounded-[1.25rem] max-md:border-0 max-md:shadow-[0_10px_32px_rgba(91,33,182,0.12)]"
        aria-busy={txLoading}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{dict.dashboard.chartTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {txError ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {txError}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            {!txLoading && cashFlowPeriodKeys.length > 0 ? (
              <p className="text-xs text-foreground/85" dir={locale === "ar" ? "rtl" : "ltr"}>
                <span className="font-medium text-muted-foreground">{dict.dashboard.chartDateRangeShown}: </span>
                {cashFlowRangeLabel}
              </p>
            ) : null}
            <div
              className="inline-flex shrink-0 rounded-lg border border-border/80 bg-muted/25 p-0.5"
              role="group"
              aria-label={dict.dashboard.chartGranularityGroupAria}
            >
              {(
                [
                  ["month", dict.dashboard.chartGranularityMonth],
                  ["quarter", dict.dashboard.chartGranularityQuarter],
                  ["year", dict.dashboard.chartGranularityYear],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCashFlowGranularity(value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                    cashFlowGranularity === value
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {txLoading ? (
            <div className="space-y-3" aria-hidden>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[4.25rem] animate-pulse rounded-xl border border-border/60 bg-muted/30" />
                ))}
              </div>
              <div className="h-40 animate-pulse rounded-xl border border-border/60 bg-muted/20" />
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                role="region"
                aria-label={dict.dashboard.chartTitle}
              >
                <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    {dict.dashboard.chartMtdIncome}
                  </div>
                  <div className="mt-1 font-semibold tabular-nums">
                    <Money amount={monthMtdIncome} locale={locale} />
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    {dict.dashboard.chartMtdExpenses}
                  </div>
                  <div className="mt-1 font-semibold tabular-nums">
                    <Money amount={monthMtdExpense} locale={locale} />
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                  <div className="text-[11px] font-medium text-muted-foreground">{dict.dashboard.chartMtdNet}</div>
                  <div
                    className={cn(
                      "mt-1 font-semibold tabular-nums",
                      monthMtdNet >= 0 ? "text-emerald-700 dark:text-emerald-500" : "text-rose-700 dark:text-rose-400"
                    )}
                  >
                    <Money amount={monthMtdNet} locale={locale} />
                  </div>
                </div>
                <div className="col-span-2 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 sm:col-span-1">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    {dict.dashboard.chartRunningTotal}
                  </div>
                  <div
                    className={cn(
                      "mt-1 font-semibold tabular-nums",
                      runningEnd >= 0 ? "text-emerald-700 dark:text-emerald-500" : "text-rose-700 dark:text-rose-400"
                    )}
                  >
                    <Money amount={runningEnd} locale={locale} />
                  </div>
                </div>
              </div>

          {!cashFlowHasActivity ? (
            <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/10 px-4 py-5 text-sm text-muted-foreground">
              <p className="text-center font-medium text-foreground/90">{dict.dashboard.chartEmptyMonth}</p>
              {transactions.length === 0 ? (
                <>
                  <p className="leading-relaxed">{dict.dashboard.chartEmptyNoTransactionLines}</p>
                  <LinkButton href="/financials" variant="outline" className="h-10 w-full sm:w-auto">
                    {dict.nav.financials}
                  </LinkButton>
                </>
              ) : (
                <p className="leading-relaxed">{dict.dashboard.chartEmptyTxOutsideWindow}</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <div className="max-h-[min(22rem,55vh)] overflow-y-auto overscroll-contain">
                <table className="w-full min-w-[28rem] border-collapse text-sm">
                  <caption className="sr-only">{dict.dashboard.chartMonthProfit}</caption>
                  <thead className="sticky top-0 z-10 border-b border-border bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground"
                      >
                        {dict.dashboard.chartColPeriod}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground"
                      >
                        {dict.transactions.income}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground"
                      >
                        {dict.transactions.expenses}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground"
                      >
                        {dict.dashboard.chartColPeriodNet}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground"
                      >
                        {dict.dashboard.chartColRunning}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displaySeries.map((row) => (
                      <tr
                        key={row.periodKey}
                        className="border-b border-border/60 bg-card last:border-b-0"
                      >
                        <th
                          scope="row"
                          className="whitespace-nowrap px-3 py-2 text-start font-medium text-foreground"
                        >
                          {row.label}
                        </th>
                        <td className="px-3 py-2 text-end tabular-nums">
                          {row.income !== 0 ? (
                            <span className="text-emerald-700 dark:text-emerald-500">
                              <Money amount={row.income} locale={locale} />
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-end tabular-nums">
                          {row.expense !== 0 ? (
                            <span className="text-rose-700 dark:text-rose-400">
                              <Money amount={row.expense} locale={locale} />
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-end font-medium tabular-nums",
                            row.profit >= 0
                              ? "text-emerald-700 dark:text-emerald-500"
                              : "text-rose-700 dark:text-rose-400"
                          )}
                        >
                          <Money amount={row.profit} locale={locale} />
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-end font-semibold tabular-nums",
                            row.cumulative >= 0
                              ? "text-emerald-800 dark:text-emerald-400"
                              : "text-rose-800 dark:text-rose-300"
                          )}
                        >
                          <Money amount={row.cumulative} locale={locale} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/10 px-3 py-2">
                  <span className="text-muted-foreground">{dict.dashboard.paid}</span>
                  <span className="font-semibold">
                    <Money amount={paid} locale={locale} />
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/10 px-3 py-2">
                  <span className="text-muted-foreground">{dict.dashboard.unpaid}</span>
                  <span className="font-semibold">
                    <Money amount={unpaid} locale={locale} />
                  </span>
                </div>
                <div
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/10 px-3 py-2"
                  title={dict.dashboard.chartGrowthFootnote}
                >
                  <span className="text-muted-foreground">{dict.dashboard.growth}</span>
                  <span className="font-semibold tabular-nums">{growthDisplay}</span>
                </div>
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">
                {dict.dashboard.chartGrowthFootnote}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="max-md:rounded-[1.25rem] max-md:border-0 max-md:shadow-[0_10px_32px_rgba(91,33,182,0.12)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{dict.dashboard.quickActions}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-wrap gap-3 sm:flex-row">
          <LinkButton
            href="/projects"
            className="h-11 text-base max-md:h-12 max-md:rounded-full max-md:font-semibold max-md:shadow-[0_6px_20px_rgba(91,33,182,0.35)]"
          >
            {dict.dashboard.viewProjects}
          </LinkButton>
          <LinkButton
            href="/projects/new"
            variant="outline"
            className="h-11 text-base max-md:h-12 max-md:rounded-full max-md:border-violet-300 max-md:font-semibold max-md:text-violet-700 max-md:hover:bg-violet-50"
          >
            {dict.dashboard.createProject}
          </LinkButton>
          <LinkButton
            href="/personal-finance"
            variant="outline"
            className="h-11 text-base max-md:h-12 max-md:rounded-full max-md:border-violet-300 max-md:font-semibold max-md:text-violet-700 max-md:hover:bg-violet-50"
          >
            {dict.nav.personalFinance}
          </LinkButton>
        </CardContent>
      </Card>

      {error ? (
        <div className="text-sm text-destructive" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  )
}


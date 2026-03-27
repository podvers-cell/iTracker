"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import {
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Clock3,
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
import { formatMoney } from "@/lib/format/money"
import { projectCollectedTotal } from "@/lib/data/projectFinance"

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0)
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1)
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function formatMonthLabel(key: string, locale: string) {
  const [y, m] = key.split("-").map((v) => Number(v))
  const d = new Date(y, (m ?? 1) - 1, 1)
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(d)
}

type StatCardProps = {
  title: string
  value: string | number
  icon: LucideIcon
  accent: string
}

function StatCard({ title, value, icon: Icon, accent }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
          <div className={`grid size-9 place-items-center rounded-xl ${accent}`}>
            <Icon className="size-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="stat-number">{value}</div>
      </CardContent>
    </Card>
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

  const totalProjects = projects.length
  const activeCount = projects.filter((p) => p.status === "active").length
  const completedCount = projects.filter((p) => p.status === "completed").length
  const onHoldCount = projects.filter((p) => p.status === "on_hold").length

  const totalIncome = sum(transactions.filter((t) => t.type === "income").map((t) => t.amount))
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

  const days = (n: number) => n * 24 * 60 * 60 * 1000
  const periodEnd = now
  const periodStart = new Date(now.getTime() - days(30))
  const prevStart = new Date(now.getTime() - days(60))
  const prevEnd = new Date(now.getTime() - days(30))

  const inRange = (dateStr: string, start: Date, end: Date) => {
    const t = Date.parse(dateStr)
    return Number.isFinite(t) && t >= start.getTime() && t < end.getTime()
  }

  const periodProfit = transactions.reduce((acc, t) => {
    if (!inRange(t.date, periodStart, periodEnd)) return acc
    return acc + (t.type === "income" ? t.amount : -t.amount)
  }, 0)

  const prevProfit = transactions.reduce((acc, t) => {
    if (!inRange(t.date, prevStart, prevEnd)) return acc
    return acc + (t.type === "income" ? t.amount : -t.amount)
  }, 0)

  const growth =
    prevProfit === 0 ? null : ((periodProfit - prevProfit) / Math.abs(prevProfit)) * 100

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = addMonths(startOfMonth(now), i - 5)
    return monthKey(d)
  })

  const series = months.map((mk) => {
    const income = transactions
      .filter((t) => t.type === "income" && t.date.startsWith(mk))
      .reduce((a, b) => a + b.amount, 0)
    const expense = transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(mk))
      .reduce((a, b) => a + b.amount, 0)
    return { month: mk, income, expense, profit: income - expense }
  })

  const maxAbsProfit = Math.max(
    1,
    ...series.map((s) => Math.abs(s.profit)),
    ...series.map((s) => Math.abs(s.income)),
    ...series.map((s) => Math.abs(s.expense))
  )

  const Chart = () => {
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
    const w = 600
    const h = 160
    const padX = 12
    const padY = 16
    const usableW = w - padX * 2
    const usableH = h - padY * 2
    const step = usableW / Math.max(1, series.length - 1)

    const y = (v: number) => padY + usableH - (v / maxAbsProfit) * usableH

    const path = series
      .map((p, i) => `${i === 0 ? "M" : "L"} ${padX + i * step} ${y(p.profit)}`)
      .join(" ")

    const trendUp = (series.at(-1)?.profit ?? 0) >= (series[0]?.profit ?? 0)
    const strokeId = trendUp ? "profitStrokeUp" : "profitStrokeDown"
    const areaId = trendUp ? "profitAreaUp" : "profitAreaDown"

    const areaPath = `${path} L ${padX + (series.length - 1) * step} ${padY + usableH} L ${padX} ${
      padY + usableH
    } Z`

    return (
      <div className="w-full">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full">
          <defs>
            <linearGradient id="profitStrokeUp" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.25" />
              <stop offset="55%" stopColor="#16a34a" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="profitStrokeDown" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.25" />
              <stop offset="55%" stopColor="#dc2626" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="profitAreaUp" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="profitAreaDown" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${areaId})`} />
          <path
            d={path}
            fill="none"
            stroke={`url(#${strokeId})`}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {series.map((p, i) => (
            <g key={p.month}>
              {(() => {
                const cx = padX + i * step
                const cy = y(p.profit)
                const tipW = 112
                const tipH = 24
                const margin = 6
                const tipX = Math.max(margin, Math.min(cx - tipW / 2, w - tipW - margin))
                const placeAbove = cy - (tipH + 10) >= margin
                const tipY = placeAbove ? cy - (tipH + 10) : cy + 10

                return (
                  <>
              <circle
                cx={cx}
                cy={cy}
                r={activeIndex === i ? "6" : "4"}
                fill={trendUp ? "#16a34a" : "#dc2626"}
                opacity={activeIndex == null || activeIndex === i ? 1 : 0.6}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              />
              {activeIndex === i ? (
                <>
                  <rect
                    x={tipX}
                    y={tipY}
                    width={tipW}
                    height={tipH}
                    rx="8"
                    fill="rgba(15,23,42,0.9)"
                  />
                  <text
                    x={tipX + tipW / 2}
                    y={tipY + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#fff"
                  >
                    {formatMoney(p.profit, locale)}
                  </text>
                </>
              ) : null}
                  </>
                )
              })()}
            </g>
          ))}
        </svg>
        <div className="mt-2 grid grid-cols-6 gap-2 text-center text-xs text-muted-foreground">
          {months.map((mk) => (
            <div key={mk}>{formatMonthLabel(mk, locale)}</div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="page-title">{dict.dashboard.title}</h1>
        <p className="page-subtitle">{dict.dashboard.overview}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title={dict.dashboard.totalProjects}
          value={totalProjects}
          icon={Briefcase}
          accent="bg-sky-100 text-sky-700"
        />
        <StatCard
          title={dict.dashboard.active}
          value={activeCount}
          icon={Clock3}
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          title={dict.dashboard.completed}
          value={completedCount}
          icon={CheckCircle2}
          accent="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          title={dict.dashboard.onHold}
          value={onHoldCount}
          icon={PauseCircle}
          accent="bg-rose-100 text-rose-700"
        />
        <StatCard
          title={dict.dashboard.totalContracts}
          value={formatMoney(totalContract, locale)}
          icon={ClipboardList}
          accent="bg-violet-100 text-violet-700"
        />
        <StatCard
          title={dict.dashboard.totalIncome}
          value={formatMoney(totalIncome, locale)}
          icon={Wallet}
          accent="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          title={dict.dashboard.totalExpenses}
          value={formatMoney(totalExpenses, locale)}
          icon={ArrowDownCircle}
          accent="bg-red-100 text-red-700"
        />
        <StatCard
          title={dict.dashboard.netProfit}
          value={formatMoney(netProfit, locale)}
          icon={HandCoins}
          accent={netProfit >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{dict.dashboard.chartTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Chart />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/10 px-3 py-2">
              <span className="text-muted-foreground">{dict.dashboard.paid}</span>
              <span className="font-semibold">{formatMoney(paid, locale)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/10 px-3 py-2">
              <span className="text-muted-foreground">{dict.dashboard.unpaid}</span>
              <span className="font-semibold">{formatMoney(unpaid, locale)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/10 px-3 py-2">
              <span className="text-muted-foreground">{dict.dashboard.growth}</span>
              <span className="font-semibold">
                {growth == null ? "—" : `${growth.toFixed(1)}%`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{dict.dashboard.quickActions}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/projects" className="h-11 text-base">
            {dict.dashboard.viewProjects}
          </LinkButton>
          <LinkButton href="/projects/new" variant="outline" className="h-11 text-base">
            {dict.dashboard.createProject}
          </LinkButton>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : error ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : txLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : txError ? (
        <div className="text-sm text-destructive">{txError}</div>
      ) : null}
    </div>
  )
}


"use client"

import * as React from "react"
import Image from "next/image"
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
import { cn } from "@/lib/utils"

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0)
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function parseLocalYmd(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map((v) => Number(v))
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function formatDayTitle(dateStr: string, locale: string) {
  const d = parseLocalYmd(dateStr)
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d)
}

function formatAxisTick(n: number, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: Math.abs(n) >= 1000 ? 0 : 1,
    }).format(n)
  } catch {
    return String(Math.round(n))
  }
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
  value: string | number
  icon: LucideIcon
  tone: StatTone
  className?: string
}

function StatCard({ title, value, icon: Icon, tone, className }: StatCardProps) {
  const t = STAT_TONE[tone]
  return (
    <Card className={cn("max-md:rounded-[1.25rem] md:shadow-sm", t.card, className)}>
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
    if (prevProfit === 0) return periodProfit === 0 ? "—" : `+${formatMoney(periodProfit, locale)}`
    const pct = growthPercent ?? 0
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
  })()

  const y = now.getFullYear()
  const mIdx = now.getMonth()
  const dayKeys = Array.from({ length: todayDay }, (_, i) => {
    const day = i + 1
    return `${y}-${String(mIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  })

  let cumulativeRun = 0
  const series = dayKeys.map((dk) => {
    const income = transactions
      .filter((t) => t.type === "income" && t.date === dk)
      .reduce((a, b) => a + b.amount, 0)
    const expense = transactions
      .filter((t) => t.type === "expense" && t.date === dk)
      .reduce((a, b) => a + b.amount, 0)
    const profit = income - expense
    cumulativeRun += profit
    return { day: dk, income, expense, profit, cumulative: cumulativeRun }
  })

  const Chart = () => {
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

    const values = series.map((s) => s.cumulative)
    const minP = Math.min(...values)
    const maxP = Math.max(...values)
    let domainMin = Math.min(minP, 0)
    let domainMax = Math.max(maxP, 0)
    let span = domainMax - domainMin
    if (span === 0) {
      domainMin -= 1
      domainMax += 1
      span = 2
    }
    const padFrac = span * 0.1
    domainMin -= padFrac
    domainMax += padFrac
    span = domainMax - domainMin

    const w = 640
    const h = 210
    const padL = 54
    const padR = 12
    const padT = 8
    const padB = 30
    const usableW = w - padL - padR
    const usableH = h - padT - padB
    const n = Math.max(1, series.length - 1)

    const yAt = (v: number) => padT + usableH - ((v - domainMin) / span) * usableH
    const xAt = (i: number) => padL + (usableW / n) * i

    const path = series
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.cumulative)}`)
      .join(" ")

    const trendUp = (series.at(-1)?.cumulative ?? 0) >= 0
    const strokeId = trendUp ? "profitStrokeUp" : "profitStrokeDown"
    const areaId = trendUp ? "profitAreaUp" : "profitAreaDown"
    const areaPath = `${path} L ${xAt(series.length - 1)} ${padT + usableH} L ${xAt(0)} ${padT + usableH} Z`

    const gridLevels = 4
    const tickValues = Array.from(
      { length: gridLevels + 1 },
      (_, i) => domainMin + (i / gridLevels) * span
    )
    const showZeroLine = domainMin < 0 && domainMax > 0
    const zeroY = yAt(0)
    const labelStep = Math.max(1, Math.ceil(series.length / 7))

    return (
      <div dir="ltr" className="w-full">
        <p className="mb-2 text-xs text-muted-foreground">{dict.dashboard.chartMonthProfit}</p>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full max-w-full">
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

          {tickValues.map((tv, gi) => (
            <g key={`grid-${gi}`}>
              <line
                x1={padL}
                x2={w - padR}
                y1={yAt(tv)}
                y2={yAt(tv)}
                className="stroke-border"
                strokeOpacity={0.35}
                strokeWidth={1}
              />
              <text
                x={padL - 8}
                y={yAt(tv)}
                dominantBaseline="middle"
                textAnchor="end"
                fontSize={10}
                className="fill-muted-foreground"
              >
                {formatAxisTick(tv, locale)}
              </text>
            </g>
          ))}

          {showZeroLine ? (
            <line
              x1={padL}
              x2={w - padR}
              y1={zeroY}
              y2={zeroY}
              className="stroke-foreground"
              strokeOpacity={0.2}
              strokeWidth={1}
              strokeDasharray="5 4"
            />
          ) : null}

          <path d={areaPath} fill={`url(#${areaId})`} className="opacity-90" />
          <path
            d={path}
            fill="none"
            stroke={`url(#${strokeId})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {series.map((p, i) => {
            if (i % labelStep === 0 || i === series.length - 1) {
              const cx = xAt(i)
              const label = String(parseLocalYmd(p.day).getDate())
              return (
                <text
                  key={`xlab-${p.day}`}
                  x={cx}
                  y={h - 8}
                  textAnchor="middle"
                  fontSize={9}
                  className="fill-muted-foreground"
                >
                  {label}
                </text>
              )
            }
            return null
          })}

          {series.map((p, i) => {
            const cx = xAt(i)
            const cy = yAt(p.cumulative)
            const tipW = 160
            const tipLine = 14
            const tipH = 8 + tipLine * 5
            const margin = 8
            let tipX = cx - tipW / 2
            tipX = Math.max(margin, Math.min(tipX, w - tipW - margin))
            const placeAbove = cy - (tipH + 12) >= margin
            const tipY = placeAbove ? cy - tipH - 12 : cy + 12
            const dayTitle = formatDayTitle(p.day, locale)

            return (
              <g key={p.day}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={activeIndex === i ? 6.5 : 4}
                  fill={p.profit >= 0 ? "#16a34a" : "#dc2626"}
                  opacity={activeIndex == null || activeIndex === i ? 1 : 0.55}
                  className="cursor-pointer transition-all"
                  onPointerEnter={() => setActiveIndex(i)}
                  onPointerLeave={() => setActiveIndex(null)}
                />
                {activeIndex === i ? (
                  <g>
                    <rect
                      x={tipX}
                      y={tipY}
                      width={tipW}
                      height={tipH}
                      rx={10}
                      fill="rgba(15,23,42,0.92)"
                    />
                    <text x={tipX + 10} y={tipY + tipLine} fontSize={10} fontWeight={600} fill="#fafafa">
                      {dayTitle}
                    </text>
                    <text x={tipX + 10} y={tipY + tipLine * 2} fontSize={9} fill="#a1a1aa">
                      {dict.transactions.income}: {formatMoney(p.income, locale)}
                    </text>
                    <text x={tipX + 10} y={tipY + tipLine * 3} fontSize={9} fill="#a1a1aa">
                      {dict.transactions.expenses}: {formatMoney(p.expense, locale)}
                    </text>
                    <text x={tipX + 10} y={tipY + tipLine * 4} fontSize={9} fill="#e4e4e7">
                      {dict.dashboard.netProfitDay}: {formatMoney(p.profit, locale)}
                    </text>
                    <text x={tipX + 10} y={tipY + tipLine * 5} fontSize={9} fill="#a1a1aa">
                      {dict.dashboard.chartMtd}: {formatMoney(p.cumulative, locale)}
                    </text>
                  </g>
                ) : null}
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

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
        <h1 className="page-title max-md:text-xl max-md:font-bold max-md:tracking-tight max-md:text-violet-950 max-md:[text-shadow:none]">
          {dict.dashboard.title}
        </h1>
        <p className="page-subtitle max-md:text-zinc-500">{dict.dashboard.overview}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard title={dict.dashboard.totalProjects} value={totalProjects} icon={Briefcase} tone="sky" />
        <StatCard title={dict.dashboard.active} value={activeCount} icon={Clock3} tone="amber" />
        <StatCard
          title={dict.dashboard.completed}
          value={completedCount}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard title={dict.dashboard.onHold} value={onHoldCount} icon={PauseCircle} tone="rose" />
        <StatCard
          title={dict.dashboard.totalContracts}
          value={formatMoney(totalContract, locale)}
          icon={ClipboardList}
          tone="violet"
        />
        <StatCard
          title={dict.dashboard.totalIncome}
          value={formatMoney(totalIncome, locale)}
          icon={Wallet}
          tone="emerald"
        />
        <StatCard
          title={dict.dashboard.totalExpenses}
          value={formatMoney(totalExpenses, locale)}
          icon={ArrowDownCircle}
          tone="red"
        />
        <StatCard
          title={dict.dashboard.netProfit}
          value={formatMoney(netProfit, locale)}
          icon={HandCoins}
          tone={netProfit >= 0 ? "emerald" : "red"}
        />
      </div>

      <Card className="max-md:rounded-[1.25rem] max-md:border-0 max-md:shadow-[0_10px_32px_rgba(91,33,182,0.12)]">
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
            <div
              className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/10 px-3 py-2"
              title={dict.dashboard.chartGrowthFootnote}
            >
              <span className="text-muted-foreground">{dict.dashboard.growth}</span>
              <span className="font-semibold tabular-nums">{growthDisplay}</span>
            </div>
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">{dict.dashboard.chartGrowthFootnote}</p>
        </CardContent>
      </Card>

      <Card className="max-md:rounded-[1.25rem] max-md:border-0 max-md:shadow-[0_10px_32px_rgba(91,33,182,0.12)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{dict.dashboard.quickActions}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
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


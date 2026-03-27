"use client"

import * as React from "react"

import { useI18n } from "@/components/i18n/I18nProvider"
import { useAuth } from "@/components/auth/AuthProvider"
import { useProjects } from "@/components/projects/useProjects"
import { useAllTransactions } from "@/components/projects/useAllTransactions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format/money"

type ChatMsg = { role: "user" | "assistant"; text: string }

function safeNameFromEmail(email?: string | null) {
  if (!email) return null
  const s = email.split("@")[0]?.trim()
  return s ? s : null
}

export default function AssistantPage() {
  const { dict, locale } = useI18n()
  const { user } = useAuth()
  const { projects } = useProjects()
  const { transactions } = useAllTransactions()

  const userLabel = user?.displayName?.trim() || safeNameFromEmail(user?.email) || "Admin"

  const totals = React.useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0)
    const expense = transactions.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0)
    return { income, expense, profit: income - expense }
  }, [transactions])

  const context = React.useMemo(() => {
    const byStatus = projects.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      userLabel,
      locale,
      counts: {
        projects: projects.length,
        transactions: transactions.length,
        byStatus,
      },
      totals: {
        totalIncomeAED: totals.income,
        totalExpensesAED: totals.expense,
        netProfitAED: totals.profit,
      },
    }
  }, [projects, transactions, totals, userLabel, locale])

  const [messages, setMessages] = React.useState<ChatMsg[]>([
    {
      role: "assistant",
      text:
        locale === "ar"
          ? "أنا مساعدك الذكي. اسألني عن الربح، المصروفات، الإيرادات، أو حالة المشاريع."
          : "I'm your AI assistant. Ask about profit, expenses, income, or project status.",
    },
  ])
  const [text, setText] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function send() {
    const q = text.trim()
    if (!q || loading) return
    setError(null)
    setLoading(true)
    setText("")
    setMessages((m) => [...m, { role: "user", text: q }])

    try {
      const idToken = user ? await user.getIdToken() : null
      if (!idToken) throw new Error("Not authenticated")

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: q,
          locale,
          context,
        }),
      })

      const data = (await res.json()) as { text?: string; error?: string }
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)

      setMessages((m) => [...m, { role: "assistant", text: data.text || "" }])
    } catch (e: any) {
      console.error("[assistant] error", e)
      setError(dict.assistant.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="hud-surface px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="page-title">{dict.assistant.title}</div>
            <div className="page-subtitle mt-1">{dict.assistant.subtitle}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Card size="sm">
            <CardHeader className="pb-0">
              <CardTitle>{dict.dashboard.totalIncome}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="stat-number">{formatMoney(totals.income, locale)}</div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader className="pb-0">
              <CardTitle>{dict.dashboard.totalExpenses}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="stat-number">{formatMoney(totals.expense, locale)}</div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader className="pb-0">
              <CardTitle>{dict.dashboard.netProfit}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="stat-number">{formatMoney(totals.profit, locale)}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="min-h-[60vh]">
        <CardHeader className="border-b">
          <CardTitle>{dict.nav.assistant}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === "user"
                    ? "self-end rounded-2xl bg-muted px-4 py-3 text-sm"
                    : "self-start rounded-2xl border bg-card px-4 py-3 text-sm"
                }
              >
                {m.text}
              </div>
            ))}
            {loading ? (
              <div className="self-start rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">
                {dict.assistant.thinking}
              </div>
            ) : null}
          </div>

          {error ? <div className="text-sm text-destructive">{error}</div> : null}

          <div className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={dict.assistant.placeholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  void send()
                }
              }}
              disabled={loading}
            />
            <Button onClick={() => void send()} disabled={loading || !text.trim()}>
              {dict.assistant.send}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


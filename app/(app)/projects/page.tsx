"use client"

import * as React from "react"
import Link from "next/link"

import { useI18n } from "@/components/i18n/I18nProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/link-button"
import { Button } from "@/components/ui/button"
import { useProjects } from "@/components/projects/useProjects"
import { deleteProjectById } from "@/lib/data/projects"
import { projectCollectedTotal } from "@/lib/data/projectFinance"
import { useAllTransactions } from "@/components/projects/useAllTransactions"
import { formatMoney } from "@/lib/format/money"

export default function ProjectsPage() {
  const { dict, locale } = useI18n()
  const { projects, loading, error, refresh } = useProjects()
  const { transactions } = useAllTransactions()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const txByProject = React.useMemo(() => {
    const map = new Map<string, { income: number; expenses: number }>()
    for (const t of transactions) {
      const prev = map.get(t.projectId) ?? { income: 0, expenses: 0 }
      if (t.type === "income") prev.income += t.amount
      else prev.expenses += t.amount
      map.set(t.projectId, prev)
    }
    return map
  }, [transactions])

  async function onDelete(projectId: string) {
    const ok = window.confirm(dict.projects.confirmDelete)
    if (!ok) return
    if (deletingId) return

    setDeletingId(projectId)
    try {
      await deleteProjectById(projectId)
      await refresh()
    } catch (e) {
      console.error("[projects] delete failed", e)
      window.alert((e as any)?.message ?? "Failed to delete project")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{dict.projects.title}</h1>
          <p className="text-sm text-muted-foreground">{dict.projects.listTitle}</p>
        </div>
        <LinkButton href="/projects/new" className="h-11 text-base">
          {dict.projects.create}
        </LinkButton>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : error ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{dict.projects.emptyTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{dict.projects.emptyBody}</p>
            <LinkButton href="/projects/new" className="h-11 text-base">
              {dict.projects.create}
            </LinkButton>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {projects.map((p) => {
            const contract = p.contractValue ?? 0
            const tx = txByProject.get(p.id) ?? { income: 0, expenses: 0 }
            const paid = projectCollectedTotal(p.collectedAmount, tx.income)
            const totalExpenses = tx.expenses
            const unpaid = Math.max(0, contract - paid)
            const totalCost = contract
            const paymentPercent =
              contract > 0
                ? Math.max(0, Math.min(100, (paid / contract) * 100))
                : p.status === "completed"
                  ? 100
                  : p.status === "active"
                    ? 50
                    : 20

            return (
              <Card key={p.id} className="transition-colors hover:bg-muted/30">
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="min-w-0">
                    <Link href={`/projects/${p.id}`} className="truncate text-base font-semibold hover:underline">
                      {p.name}
                    </Link>
                    {p.clientName ? (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {dict.projects.client}: {p.clientName}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-xl border border-border/60 px-3 py-2">
                      <div className="text-muted-foreground">{dict.projects.totalCost}</div>
                      <div className="font-semibold">{formatMoney(totalCost, locale)}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 px-3 py-2">
                      <div className="text-muted-foreground">{dict.projects.paid}</div>
                      <div className="font-semibold text-emerald-700">{formatMoney(paid, locale)}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 px-3 py-2">
                      <div className="text-muted-foreground">{dict.projects.unpaid}</div>
                      <div className="font-semibold text-amber-700">{formatMoney(unpaid, locale)}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 px-3 py-2">
                      <div className="text-muted-foreground">{dict.projects.totalExpenses}</div>
                      <div className="font-semibold text-rose-700">{formatMoney(totalExpenses, locale)}</div>
                    </div>
                    <div className="rounded-xl border border-border/60 px-3 py-2">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>{dict.projects.progress}</span>
                        <span className="font-medium text-foreground">{paymentPercent.toFixed(0)}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${paymentPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <LinkButton href={`/projects/${p.id}`} variant="outline" size="sm">
                      {dict.projects.details}
                    </LinkButton>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === p.id}
                      onClick={() => void onDelete(p.id)}
                    >
                      {deletingId === p.id ? dict.projects.deleting : dict.projects.delete}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}


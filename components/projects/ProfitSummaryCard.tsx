"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/components/i18n/I18nProvider"
import { formatMoney } from "@/lib/format/money"

export function ProfitSummaryCard({
  incomeTotal,
  expenseTotal,
}: {
  incomeTotal: number
  expenseTotal: number
}) {
  const { dict, locale } = useI18n()
  const profit = incomeTotal - expenseTotal

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{dict.projectDetails.summary}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card px-4 py-3">
            <div className="text-sm text-muted-foreground">
              {dict.projectDetails.income}
            </div>
            <div className="mt-1 text-lg font-semibold">
              {formatMoney(incomeTotal, locale)}
            </div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3">
            <div className="text-sm text-muted-foreground">
              {dict.projectDetails.expenses}
            </div>
            <div className="mt-1 text-lg font-semibold">
              {formatMoney(expenseTotal, locale)}
            </div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3">
            <div className="text-sm text-muted-foreground">
              {dict.projectDetails.profit}
            </div>
            <div className="mt-1 text-lg font-semibold">
              {formatMoney(profit, locale)}
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {dict.projectDetails.demoDisclaimer}
        </div>
      </CardContent>
    </Card>
  )
}


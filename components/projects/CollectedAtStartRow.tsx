"use client"

import { useI18n } from "@/components/i18n/I18nProvider"
import { formatMoney } from "@/lib/format/money"

export function CollectedAtStartRow({
  amount,
  startDate,
}: {
  amount: number
  startDate: string | null
}) {
  const { dict, locale } = useI18n()

  return (
    <div className="flex items-start justify-between gap-3 px-3 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{dict.transactions.collectedAtStart}</div>
        <div className="mt-1 text-sm text-muted-foreground">{dict.transactions.collectedAtStartNote}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {startDate ?? dict.projectDetails.notAvailable}
        </div>
      </div>
      <div className="shrink-0 text-sm font-semibold text-emerald-700 dark:text-emerald-500">
        {formatMoney(amount, locale)}
      </div>
    </div>
  )
}

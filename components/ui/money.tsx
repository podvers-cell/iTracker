"use client"

import * as React from "react"

import { UaeDirhamSymbol } from "@/components/icons/UaeDirhamSymbol"
import { formatMoneyAmount } from "@/lib/format/money"
import { cn } from "@/lib/utils"

export function Money({
  amount,
  locale,
  className,
  symbolClassName,
}: {
  amount: number
  locale: string
  className?: string
  symbolClassName?: string
}) {
  const formatted = formatMoneyAmount(amount, locale)
  const spokenLabel = locale === "ar" ? `${formatted} د.إ` : `${formatted} AED`

  return (
    <span
      className={cn("inline-flex max-w-full min-w-0 items-center justify-end gap-0.5 tabular-nums", className)}
      dir="ltr"
      aria-label={spokenLabel}
    >
      <span aria-hidden className="min-w-0 truncate">
        {formatted}
      </span>
      <UaeDirhamSymbol
        className={cn(
          "inline-block h-[0.62em] w-[0.71em] shrink-0 translate-y-[0.04em] self-center text-current",
          symbolClassName
        )}
        aria-hidden
      />
    </span>
  )
}

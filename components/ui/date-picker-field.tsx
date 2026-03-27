"use client"

import * as React from "react"
import { Popover } from "@base-ui/react/popover"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { useI18n } from "@/components/i18n/I18nProvider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { compareISODates, parseISODateLocal, toISODateLocal } from "@/lib/dates/localDate"

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1)
}

function monthGrid(year: number, monthIndex: number, weekStartsOnMonday: boolean) {
  const first = new Date(year, monthIndex, 1)
  const lead = weekStartsOnMonday ? (first.getDay() + 6) % 7 : first.getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells: Array<{ day: number; iso: string } | null> = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    const m = String(monthIndex + 1).padStart(2, "0")
    const dd = String(day).padStart(2, "0")
    cells.push({ day, iso: `${year}-${m}-${dd}` })
  }
  return cells
}

export type DatePickerFieldProps = {
  id?: string
  name: string
  /** Minimum selectable calendar date (YYYY-MM-DD), inclusive. Uses local dates. */
  minDate?: string
  value?: string
  defaultValue?: string
  onValueChange?: (iso: string) => void
  className?: string
  disabled?: boolean
}

export function DatePickerField({
  id,
  name,
  minDate,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  className,
  disabled,
}: DatePickerFieldProps) {
  const { dict, locale } = useI18n()
  const isControlled = valueProp !== undefined
  const [internal, setInternal] = React.useState(defaultValue)
  const selected = isControlled ? (valueProp ?? "") : internal

  const setSelected = React.useCallback(
    (v: string) => {
      if (!isControlled) setInternal(v)
      onValueChange?.(v)
    },
    [isControlled, onValueChange]
  )

  const [open, setOpen] = React.useState(false)
  const [viewMonth, setViewMonth] = React.useState(() => startOfMonth(new Date()))
  const todayIso = React.useMemo(() => toISODateLocal(new Date()), [])

  const weekStartsOnMonday = locale !== "ar"
  const localeTag = locale === "ar" ? "ar" : undefined

  const weekdayLabels = React.useMemo(() => {
    const order = weekStartsOnMonday ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]
    const fmt = new Intl.DateTimeFormat(localeTag, { weekday: "narrow" })
    return order.map((dow) => {
      const ref = new Date(2024, 0, 7 + dow)
      return fmt.format(ref)
    })
  }, [localeTag, weekStartsOnMonday])

  React.useEffect(() => {
    if (!open) return
    const base = selected ? parseISODateLocal(selected) : new Date()
    const d = base ?? new Date()
    setViewMonth(startOfMonth(d))
  }, [open, selected])

  const vy = viewMonth.getFullYear()
  const vm = viewMonth.getMonth()
  const monthLabel = new Intl.DateTimeFormat(localeTag, {
    month: "long",
    year: "numeric",
  }).format(new Date(vy, vm, 1))

  const cells = monthGrid(vy, vm, weekStartsOnMonday)

  const displayLabel = React.useMemo(() => {
    if (!selected) return null
    const d = parseISODateLocal(selected)
    if (!d) return selected
    return new Intl.DateTimeFormat(localeTag, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d)
  }, [localeTag, selected])

  const canPickToday = !minDate || compareISODates(todayIso, minDate) >= 0

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <input type="hidden" name={name} value={selected} readOnly aria-hidden />
      <Popover.Trigger
        id={id}
        type="button"
        disabled={disabled}
        className={cn(
          "flex h-14 w-full items-center justify-between gap-3 rounded-3xl border border-input bg-background/95 px-4 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground",
          className
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate text-start", locale === "ar" && "text-end")}>
          {displayLabel ?? dict.datePicker.placeholder}
        </span>
        <CalendarIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={8} className="z-50">
          <Popover.Popup
            className={cn(
              "w-[min(calc(100vw-2rem),20rem)] origin-(--transform-origin) rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl outline-none transition-[transform,opacity] duration-150 data-closed:scale-[0.98] data-closed:opacity-0 data-open:scale-100 data-open:opacity-100"
            )}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <Popover.Title className="sr-only">{dict.datePicker.placeholder}</Popover.Title>

            <div className="mb-3 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-xl"
                aria-label={locale === "ar" ? "الشهر السابق" : "Previous month"}
                onClick={() => setViewMonth((v) => addMonths(v, -1))}
              >
                <ChevronLeft className="size-5 rtl:rotate-180" />
              </Button>
              <div className="min-w-0 flex-1 text-center text-sm font-semibold capitalize">
                {monthLabel}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-xl"
                aria-label={locale === "ar" ? "الشهر التالي" : "Next month"}
                onClick={() => setViewMonth((v) => addMonths(v, 1))}
              >
                <ChevronRight className="size-5 rtl:rotate-180" />
              </Button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
              {weekdayLabels.map((w, i) => (
                <div key={i} className="py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, idx) =>
                cell == null ? (
                  <div key={`e-${idx}`} className="aspect-square" />
                ) : (
                  <button
                    key={cell.iso}
                    type="button"
                    disabled={Boolean(minDate && compareISODates(cell.iso, minDate) < 0)}
                    onClick={() => {
                      setSelected(cell.iso)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-xl text-sm font-medium transition-colors",
                      "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      "disabled:pointer-events-none disabled:opacity-35",
                      cell.iso === selected &&
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                      cell.iso === todayIso &&
                        cell.iso !== selected &&
                        "ring-1 ring-primary/40 ring-inset"
                    )}
                  >
                    {cell.day}
                  </button>
                )
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  setSelected("")
                  setOpen(false)
                }}
              >
                {dict.datePicker.clear}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!canPickToday}
                onClick={() => {
                  if (!canPickToday) return
                  setSelected(todayIso)
                  setOpen(false)
                }}
              >
                {dict.datePicker.today}
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

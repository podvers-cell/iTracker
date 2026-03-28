"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"

import { useI18n } from "@/components/i18n/I18nProvider"
import type { Project } from "@/lib/data/projects"
import type { Transaction } from "@/lib/data/transactions"
import { buildDeadlineAlerts } from "@/lib/notifications/deadlineAlerts"
import { formatMoneyAmount } from "@/lib/format/money"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

function fillTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  let s = template
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{${k}}`).join(String(v))
  }
  return s
}

type BellButtonProps = {
  className?: string
  open: boolean
  count: number
  loading: boolean
}

function NotificationsBellTrigger({ className, open, count, loading }: BellButtonProps) {
  const { dict } = useI18n()

  return (
    <DropdownMenuTrigger
      type="button"
      aria-label={dict.notifications.ariaLabel}
      aria-haspopup="menu"
      aria-expanded={open}
      disabled={loading}
      render={
        <Button
          variant="ghost"
          size={className ? "icon-lg" : "icon-sm"}
          className={cn("relative shrink-0 rounded-xl", className)}
        />
      }
    >
      <Bell
        className={className ? "size-[1.125rem]" : "size-4"}
        strokeWidth={2}
        aria-hidden
      />
      {!loading && count > 0 ? (
        <span
          className="absolute -end-0.5 -top-0.5 grid min-w-[1.1rem] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground shadow"
          aria-hidden
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </DropdownMenuTrigger>
  )
}

export function DeadlineNotificationsButton({
  projects,
  transactions,
  loading,
  className,
}: {
  projects: Project[]
  transactions: Transaction[]
  loading: boolean
  className?: string
}) {
  const { dict, locale } = useI18n()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const incomeByProject = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      if (t.type !== "income") continue
      const a = Number.isFinite(t.amount) ? t.amount : 0
      map.set(t.projectId, (map.get(t.projectId) ?? 0) + a)
    }
    return map
  }, [transactions])

  const alerts = React.useMemo(
    () => buildDeadlineAlerts(projects, incomeByProject),
    [projects, incomeByProject]
  )

  const n = alerts.length

  const deliveryMessage = (a: (typeof alerts)[0]) => {
    const project = a.projectName
    if (a.daysUntil < 0) {
      const days = Math.abs(a.daysUntil)
      return fillTemplate(dict.notifications.deliveryOverdue, { project, days })
    }
    if (a.daysUntil === 0) {
      return fillTemplate(dict.notifications.deliveryToday, { project })
    }
    if (a.daysUntil === 1) {
      return fillTemplate(dict.notifications.deliveryTomorrow, { project })
    }
    return fillTemplate(dict.notifications.deliveryInDays, {
      project,
      days: a.daysUntil,
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <NotificationsBellTrigger
        className={className}
        open={open}
        count={n}
        loading={loading}
      />
      <DropdownMenuContent
        align="end"
        className="z-50 w-[min(calc(100vw-2rem),22rem)] max-w-[calc(100vw-2rem)] p-0"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-foreground">
            {dict.notifications.title}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-72 overflow-y-auto py-1">
          {loading ? (
            <div className="px-3 py-4 text-sm text-muted-foreground">
              {dict.notifications.loading}
            </div>
          ) : n === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground">
              {dict.notifications.empty}
            </div>
          ) : (
            alerts.map((a) => (
              <DropdownMenuItem
                key={a.projectId}
                className="cursor-pointer items-start rounded-none px-3 py-2.5 whitespace-normal"
                onClick={() => {
                  setOpen(false)
                  router.push(`/projects/${a.projectId}`)
                }}
              >
                <div className="flex min-w-0 flex-col gap-1 text-start">
                  <p className="text-sm leading-snug text-foreground">
                    {deliveryMessage(a)}
                  </p>
                  {a.uncollected != null ? (
                    <p className="text-xs leading-snug text-muted-foreground">
                      {fillTemplate(dict.notifications.collectDue, {
                        amount: formatMoneyAmount(a.uncollected, locale),
                      })}
                    </p>
                  ) : null}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        {!loading && n > 0 ? (
          <>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuItem
              className="justify-center text-primary"
              onClick={() => {
                setOpen(false)
                router.push("/projects")
              }}
            >
              {dict.notifications.viewProjects}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

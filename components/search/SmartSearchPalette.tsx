"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRightLeft,
  FolderKanban,
  House,
  ListTodo,
  Plus,
  Search,
  Users,
  Wallet,
  Wallet2,
} from "lucide-react"

import { useI18n } from "@/components/i18n/I18nProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { Project } from "@/lib/data/projects"
import type { Customer } from "@/lib/data/customers"
import type { Transaction } from "@/lib/data/transactions"
import type { GeneralTask } from "@/lib/data/generalTasks"
import { buildSmartSearchRows, type SearchRow, type SearchRowGroup } from "@/lib/search/smartSearch"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: Project[]
  customers: Customer[]
  transactions: Transaction[]
  tasks: GeneralTask[]
}

const navRowIconClass = "size-4 shrink-0 text-violet-600 opacity-90"

function navPageIcon(href: string) {
  switch (href) {
    case "/dashboard":
      return <House className={navRowIconClass} strokeWidth={2.25} aria-hidden />
    case "/projects":
      return <FolderKanban className={navRowIconClass} aria-hidden />
    case "/projects/new":
      return <Plus className={navRowIconClass} aria-hidden />
    case "/customers":
      return <Users className={navRowIconClass} aria-hidden />
    case "/tasks":
      return <ListTodo className={navRowIconClass} strokeWidth={2.25} aria-hidden />
    case "/financials":
      return <Wallet className={navRowIconClass} aria-hidden />
    case "/personal-finance":
      return <Wallet2 className={navRowIconClass} aria-hidden />
    default:
      return <House className={navRowIconClass} strokeWidth={2.25} aria-hidden />
  }
}

function groupIcon(g: SearchRowGroup) {
  switch (g) {
    case "nav":
      return <House className="size-4 opacity-70" strokeWidth={2.25} />
    case "project":
      return <FolderKanban className="size-4 opacity-70" />
    case "customer":
      return <Users className="size-4 opacity-70" />
    case "task":
      return <ListTodo className="size-4 opacity-70" strokeWidth={2.25} />
    case "transaction":
      return <ArrowRightLeft className="size-4 opacity-70" />
  }
}

export function SmartSearchPalette({ open, onOpenChange, projects, customers, transactions, tasks }: Props) {
  const { dict, locale } = useI18n()
  const router = useRouter()
  const [q, setQ] = React.useState("")
  const [active, setActive] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      setQ("")
      setActive(0)
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  React.useEffect(() => {
    setActive(0)
  }, [q])

  const rows = React.useMemo(
    () =>
      buildSmartSearchRows({ query: q, projects, customers, transactions, tasks, dict }),
    [q, projects, customers, transactions, tasks, dict]
  )

  const safeActive = rows.length === 0 ? 0 : Math.min(active, rows.length - 1)

  const groupTitle = (g: SearchRowGroup) => {
    if (g === "nav") return dict.search.groupNav
    if (g === "project") return dict.search.groupProjects
    if (g === "customer") return dict.search.groupCustomers
    if (g === "task") return dict.search.groupTasks
    return dict.search.groupTransactions
  }

  const navigate = React.useCallback(
    (href: string) => {
      onOpenChange(false)
      router.push(href)
    },
    [onOpenChange, router]
  )

  const onPick = React.useCallback(
    (row: SearchRow) => {
      navigate(row.href)
    },
    [navigate]
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, Math.max(0, rows.length - 1)))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && rows.length > 0) {
      e.preventDefault()
      onPick(rows[safeActive])
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="center"
        className="flex max-h-[min(92dvh,640px)] flex-col gap-0 border-violet-200/50 bg-background/95 p-0 shadow-[0_24px_64px_-12px_rgba(91,33,182,0.22)] backdrop-blur-xl sm:max-w-lg"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{dict.search.title}</SheetTitle>
          <SheetDescription>{dict.search.shortcutHint}</SheetDescription>
        </SheetHeader>
        <div className="flex items-center gap-2 border-b px-3 py-3">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={dict.search.placeholder}
            className="h-11 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            dir={locale === "ar" ? "rtl" : "ltr"}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="smart-search-results"
          />
        </div>
        <p className="px-4 pb-1 text-[11px] text-muted-foreground">{dict.search.shortcutHint}</p>
        <div
          id="smart-search-results"
          role="listbox"
          className="min-h-0 flex-1 overflow-y-auto px-2 pb-4"
        >
          {rows.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">{dict.search.empty}</p>
          ) : (
            rows.map((row, idx) => {
              const showHeading = idx === 0 || row.group !== rows[idx - 1]!.group
              const selected = idx === safeActive
              return (
                <div key={row.key}>
                  {showHeading ? (
                    <div
                      className={cn(
                        "sticky top-0 z-[1] bg-popover/95 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm",
                        idx > 0 && "mt-1 border-t border-border/60 pt-3"
                      )}
                    >
                      {groupTitle(row.group)}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => onPick(row)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-start text-sm transition-colors",
                      selected ? "bg-primary/15 text-foreground" : "hover:bg-muted/80"
                    )}
                  >
                    <span className="mt-0.5 text-muted-foreground">
                      {row.group === "nav" ? navPageIcon(row.href) : groupIcon(row.group)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium leading-snug">{row.primary}</span>
                      {row.secondary ? (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {row.secondary}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Compact trigger for toolbars (icon + optional label). */
export function SmartSearchTrigger({
  onClick,
  className,
  label,
  ariaLabel,
  chrome = "default",
}: {
  onClick: () => void
  className?: string
  label?: string
  ariaLabel: string
  /** `mobilePurple`: glass pill on gradient header (reference app style). */
  chrome?: "default" | "mobilePurple"
}) {
  const purpleChrome =
    chrome === "mobilePurple" &&
    "size-10 min-h-10 min-w-10 rounded-full border border-white/35 bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-md hover:bg-white/25 hover:text-white focus-visible:border-white/50 focus-visible:ring-2 focus-visible:ring-white/40 [&_svg]:text-white"

  return (
    <Button
      type="button"
      variant={label ? "outline" : "ghost"}
      size={label ? "default" : chrome === "mobilePurple" ? "icon-lg" : "icon-sm"}
      className={cn(
        "shrink-0 gap-2 rounded-xl",
        !label && chrome !== "mobilePurple" && "rounded-xl",
        purpleChrome,
        className
      )}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <Search className={chrome === "mobilePurple" ? "size-[1.125rem]" : "size-4"} strokeWidth={2} />
      {label ? <span className="text-sm font-medium">{label}</span> : null}
    </Button>
  )
}

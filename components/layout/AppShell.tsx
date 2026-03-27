"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Plus,
  FolderKanban,
  Users,
  Wallet,
  Sparkles,
  X,
  Settings,
} from "lucide-react"

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { useI18n } from "@/components/i18n/I18nProvider"
import { LogoutButton } from "@/components/auth/LogoutButton"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Project } from "@/lib/data/projects"
import type { Transaction } from "@/lib/data/transactions"
import { useProjects } from "@/components/projects/useProjects"
import { useAllTransactions } from "@/components/projects/useAllTransactions"
import { DeadlineNotificationsButton } from "@/components/notifications/DeadlineNotificationsButton"

type NavItem = {
  href: string
  icon: React.ReactNode
  label: string
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { dict } = useI18n()

  const items: NavItem[] = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard className="size-4" />,
      label: dict.nav.dashboard,
    },
    {
      href: "/projects",
      icon: <FolderKanban className="size-4" />,
      label: dict.nav.projects,
    },
    {
      href: "/projects/new",
      icon: <Plus className="size-4" />,
      label: dict.nav.newProject,
    },
    {
      href: "/customers",
      icon: <Users className="size-4" />,
      label: dict.nav.customers,
    },
    {
      href: "/financials",
      icon: <Wallet className="size-4" />,
      label: dict.nav.financials,
    },
  ]

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm transition-all duration-200",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-primary/35"
                : "text-sidebar-foreground hover:bg-sidebar-accent/70"
            )}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function MobileSettingsSheet({ userLabel }: { userLabel: string }) {
  const { dict, locale, setLocale } = useI18n()
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.common.settings}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "group relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border shadow-lg",
          "border-border/50 bg-background/75 backdrop-blur-xl backdrop-saturate-150",
          "text-primary transition-all duration-300 ease-out",
          "active:scale-[0.97]",
          "hover:border-primary/35 hover:bg-background/85 hover:shadow-xl hover:shadow-primary/10",
          open && "border-primary/45 ring-2 ring-primary/25 shadow-primary/15"
        )}
      >
        <span
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100",
            open && "from-primary/30"
          )}
          aria-hidden
        />
        <Settings
          className={cn(
            "relative size-5 transition-transform duration-300 ease-out",
            "group-hover:rotate-90 group-active:scale-95",
            open && "rotate-45"
          )}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="center" className="gap-0 p-0 sm:w-full" showCloseButton>
          <SheetHeader className="border-b px-6 py-4 text-start">
            <SheetTitle className="text-start">{dict.common.welcome}</SheetTitle>
            <SheetDescription className="text-start text-base font-semibold text-foreground">
              {userLabel}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 px-6 py-5">
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">{dict.common.language}</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={locale === "ar" ? "default" : "outline"}
                  className="h-11"
                  onClick={() => {
                    setLocale("ar")
                    setOpen(false)
                  }}
                >
                  {dict.common.arabic}
                </Button>
                <Button
                  type="button"
                  variant={locale === "en" ? "default" : "outline"}
                  className="h-11"
                  onClick={() => {
                    setLocale("en")
                    setOpen(false)
                  }}
                >
                  {dict.common.english}
                </Button>
              </div>
            </div>
            <Separator />
            <LogoutButton className="h-11 w-full justify-center" />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function MobileBottomNav() {
  const pathname = usePathname()
  const { dict } = useI18n()

  const items: Array<{ href: string; label: string; icon: React.ReactNode }> = [
    { href: "/dashboard", label: dict.nav.dashboard, icon: <LayoutDashboard className="size-5" /> },
    { href: "/projects", label: dict.nav.projects, icon: <FolderKanban className="size-5" /> },
    { href: "/projects/new", label: dict.nav.newProject, icon: <Plus className="size-5" /> },
    { href: "/customers", label: dict.nav.customers, icon: <Users className="size-5" /> },
    { href: "/financials", label: dict.nav.financials, icon: <Wallet className="size-5" /> },
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    if (href === "/projects") return pathname === "/projects" || pathname?.startsWith("/projects/")
    if (href === "/projects/new") return pathname === "/projects/new"
    if (href === "/customers") return pathname === "/customers"
    if (href === "/financials") return pathname === "/financials"
    return pathname === href
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 md:hidden">
      <div className="mx-auto max-w-3xl px-4 pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="hud-surface border border-border/70 bg-card/95 px-2 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
          <div className="grid grid-cols-5 gap-1">
            {items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] leading-none transition-colors",
                    active
                      ? "bg-muted text-foreground ring-1 ring-primary/30"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

type ChatMsg = { role: "user" | "assistant"; text: string }

function FloatingAssistantButton({
  projects,
  transactions,
}: {
  projects: Project[]
  transactions: Transaction[]
}) {
  const { dict, locale } = useI18n()
  const { user } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [text, setText] = React.useState("")
  const [messages, setMessages] = React.useState<ChatMsg[]>([
    {
      role: "assistant",
      text:
        locale === "ar"
          ? "مرحبًا، أنا المساعد الذكي. كيف أقدر أساعدك اليوم؟"
          : "Hi, I'm your AI assistant. How can I help today?",
    },
  ])

  const context = React.useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0)
    const expense = transactions.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0)
    const byStatus = projects.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    return {
      locale,
      totals: { totalIncomeAED: income, totalExpensesAED: expense, netProfitAED: income - expense },
      counts: { projects: projects.length, transactions: transactions.length, byStatus },
    }
  }, [locale, projects, transactions])

  const send = React.useCallback(async () => {
    const q = text.trim()
    if (!q || loading) return
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
        body: JSON.stringify({ message: q, locale, context }),
      })

      const data = (await res.json()) as { text?: string; error?: string }
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
      setMessages((m) => [...m, { role: "assistant", text: data.text || "" }])
    } catch (e) {
      console.error("[assistant-widget] error", e)
      setMessages((m) => [
        ...m,
        { role: "assistant", text: dict.assistant.error },
      ])
    } finally {
      setLoading(false)
    }
  }, [text, loading, user, locale, context, dict.assistant.error])

  return (
    <>
      {open ? (
        <div
          className={cn(
            "fixed bottom-24 right-4 z-40 w-[370px] max-w-[calc(100vw-1.25rem)] overflow-hidden rounded-3xl md:bottom-8 md:right-8",
            "border-2 border-zinc-600 bg-zinc-950 shadow-[0_24px_64px_rgba(0,0,0,0.7)]"
          )}
        >
          <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-900 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl border border-zinc-600 bg-zinc-800">
                <Sparkles className="size-4 text-amber-300" strokeWidth={2} />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight text-zinc-100">
                  {dict.nav.assistant}
                </div>
                <div className="text-[11px] text-zinc-400">{locale === "ar" ? "متصل الآن" : "Online now"}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="h-[360px] space-y-3 overflow-y-auto bg-zinc-950 p-4 md:h-[420px]">
            {messages.map((m, idx) => (
              <div key={idx} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "border border-violet-400 bg-violet-600 text-white shadow-md"
                      : "border border-zinc-600 bg-zinc-800 text-zinc-100 shadow-sm"
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading ? <div className="text-xs text-zinc-500">{dict.assistant.thinking}</div> : null}
          </div>

          <div className="border-t border-zinc-700 bg-zinc-900 p-3">
            <div className="flex items-center gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={dict.assistant.placeholder}
                disabled={loading}
                className="h-11 rounded-2xl border-2 border-zinc-600 bg-zinc-950 text-zinc-50 placeholder:text-zinc-500 focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    void send()
                  }
                }}
              />
              <Button
                size="sm"
                type="button"
                onClick={() => void send()}
                disabled={loading || !text.trim()}
                className="h-11 shrink-0 rounded-2xl border-2 border-amber-400 bg-amber-500 px-4 font-semibold text-zinc-950 shadow-md hover:bg-amber-400 hover:border-amber-300 disabled:opacity-50"
              >
                {dict.assistant.send}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="group fixed bottom-24 right-4 z-30 md:bottom-8 md:right-8">
        <div className="relative flex items-center justify-center">
          {!open ? (
            <>
              <span
                className="assistant-fab-ping pointer-events-none absolute -inset-2 rounded-full bg-black/12 motion-safe:animate-ping motion-safe:[animation-duration:2.2s]"
                aria-hidden
              />
              <span
                className="assistant-fab-ping pointer-events-none absolute -inset-2 rounded-full bg-black/6 motion-safe:animate-ping motion-safe:[animation-duration:2.2s] motion-safe:[animation-delay:0.8s]"
                aria-hidden
              />
            </>
          ) : null}
          <button
            type="button"
            aria-label="AI Assistant"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "relative flex size-[3.75rem] items-center justify-center rounded-full md:size-14",
              "border-2 border-black bg-zinc-900 text-zinc-100",
              "transition-all duration-200",
              "hover:border-zinc-950 hover:bg-zinc-800",
              "active:scale-[0.96]",
              !open && "assistant-fab-button"
            )}
          >
            {open ? (
              <X className="size-6 text-zinc-100" strokeWidth={2.5} />
            ) : (
              <Sparkles className="size-7 text-zinc-100" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { dict } = useI18n()
  const { user } = useAuth()
  const { projects, loading: projectsLoading } = useProjects()
  const { transactions, loading: txLoading } = useAllTransactions()
  const dataLoading = projectsLoading || txLoading

  const userLabel =
    user?.displayName?.trim() ||
    user?.email?.split("@")[0]?.trim() ||
    "Admin"

  const notifyProps = {
    projects,
    transactions,
    loading: dataLoading,
  } as const

  const sidebar = (
    <aside className="hidden w-80 px-6 py-6 md:block">
      <div className="hud-surface p-5 bg-sidebar">
        <div className="flex items-center justify-center">
          <img src="/logo.svg" alt={dict.appName} className="size-36 rounded-3xl" />
        </div>
        <div className="mt-3 text-center text-sm text-muted-foreground">
          {dict.common.welcome} <span className="font-medium text-foreground/90">{userLabel}</span>
        </div>
        <Separator className="my-4 opacity-50" />
        <SidebarNav />
        <Separator className="my-4 opacity-50" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <LogoutButton />
        </div>
      </div>
    </aside>
  )

  const content = (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="shrink-0 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 md:hidden">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
          >
            <img
              src="/logo.svg"
              alt={dict.appName}
              className="size-11 rounded-2xl object-contain"
            />
          </Link>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <DeadlineNotificationsButton {...notifyProps} />
            <MobileSettingsSheet userLabel={userLabel} />
          </div>
        </div>
      </header>
      <div className="hidden md:flex justify-start px-5 rtl:justify-end md:px-8 md:pt-6">
        <DeadlineNotificationsButton {...notifyProps} />
      </div>
      <main className="flex flex-1 flex-col px-5 py-6 pb-28 md:px-8 md:pb-0 md:pt-6">
        {children}
      </main>
    </div>
  )

  return (
    <div className="min-h-[100svh]">
      <div className="relative flex w-full">
        {/* Keep sidebar first: with dir=rtl it appears right, with dir=ltr it appears left */}
        {sidebar}
        {content}
      </div>

      <MobileBottomNav />
      <FloatingAssistantButton projects={projects} transactions={transactions} />
    </div>
  )
}


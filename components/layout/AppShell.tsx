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
import { useProjects } from "@/components/projects/useProjects"
import { useAllTransactions } from "@/components/projects/useAllTransactions"

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
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Settings className="size-4" />
        {dict.common.settings}
      </Button>

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

function FloatingAssistantButton() {
  const { dict, locale } = useI18n()
  const { user } = useAuth()
  const { projects } = useProjects()
  const { transactions } = useAllTransactions()
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
        <div className="fixed bottom-24 right-4 z-40 w-[370px] max-w-[calc(100vw-1.25rem)] overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_rgba(0,0,0,0.22)] md:bottom-8 md:right-8">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-full bg-primary-foreground/20">
                <Sparkles className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">{dict.nav.assistant}</div>
                <div className="text-[11px] opacity-90">{locale === "ar" ? "متصل الآن" : "Online now"}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-md p-1 hover:bg-primary-foreground/15"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="h-[360px] space-y-3 overflow-y-auto p-4 md:h-[420px]">
            {messages.map((m, idx) => (
              <div key={idx} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="text-xs text-muted-foreground">{dict.assistant.thinking}</div>
            ) : null}
          </div>

          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={dict.assistant.placeholder}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    void send()
                  }
                }}
              />
              <Button size="sm" onClick={() => void send()} disabled={loading || !text.trim()}>
                {dict.assistant.send}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="AI Assistant"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(79,70,229,0.35)] transition-transform hover:scale-105",
          "bottom-24 md:bottom-8",
          "right-4 md:right-8"
        )}
      >
        {open ? <X className="size-6" /> : <Sparkles className="size-6" />}
      </button>
    </>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { dict, locale } = useI18n()
  const { user } = useAuth()

  const userLabel =
    user?.displayName?.trim() ||
    user?.email?.split("@")[0]?.trim() ||
    "Admin"

  const rtl = locale === "ar"
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
    <div className="flex min-w-0 flex-1 flex-col px-5 py-6 md:px-8">
      <div className="mb-4 flex items-center justify-end md:hidden">
        <MobileSettingsSheet userLabel={userLabel} />
      </div>
      <main className="flex-1 pb-28 md:pb-0">{children}</main>
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
      <FloatingAssistantButton />
    </div>
  )
}


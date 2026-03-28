"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  House,
  Plus,
  FolderKanban,
  Users,
  Wallet,
  Wallet2,
  Settings,
  Search,
  ListTodo,
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
import { cn } from "@/lib/utils"
import { useProjects } from "@/components/projects/useProjects"
import { useAllTransactions } from "@/components/projects/useAllTransactions"
import { useCustomers } from "@/components/customers/useCustomers"
import { useGeneralTasks } from "@/components/tasks/useGeneralTasks"
import { SmartSearchPalette, SmartSearchTrigger } from "@/components/search/SmartSearchPalette"
import { DeadlineNotificationsButton } from "@/components/notifications/DeadlineNotificationsButton"
import { AppLogo } from "@/components/branding/AppLogo"
import { SplashStyleBackdrop } from "@/components/shell/splash-shared"
import { AccountDataSection } from "@/components/account/AccountDataSection"

/** Glass circular actions on the purple mobile header (ticket-app style). */
const MOBILE_TOP_GLASS_BTN =
  "size-10 min-h-10 min-w-10 rounded-full border border-white/35 bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-md hover:bg-white/25 hover:text-white focus-visible:border-white/50 focus-visible:ring-2 focus-visible:ring-white/40 [&_svg]:text-white"

function UserAvatar({
  photoUrl,
  label,
  className,
  sizeClassName = "size-10",
}: {
  photoUrl?: string | null
  label: string
  className?: string
  /** e.g. size-12 for settings header */
  sizeClassName?: string
}) {
  const [broken, setBroken] = React.useState(false)
  const initial = (label.trim().charAt(0) || "?").toUpperCase()

  const ring = "shrink-0 rounded-full object-cover ring-2 ring-violet-200/70"

  if (photoUrl && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Firestore/OAuth URLs; avoids remotePatterns config
      <img
        src={photoUrl}
        alt=""
        width={48}
        height={48}
        className={cn(ring, sizeClassName, className)}
        onError={() => setBroken(true)}
      />
    )
  }

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-violet-100 text-sm font-semibold text-violet-800 ring-2 ring-violet-200/70",
        sizeClassName,
        className
      )}
      aria-hidden
    >
      {initial}
    </div>
  )
}

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
      icon: <House className="size-4" strokeWidth={2.25} />,
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
      href: "/tasks",
      icon: <ListTodo className="size-4" strokeWidth={2.25} />,
      label: dict.nav.tasks,
    },
    {
      href: "/financials",
      icon: <Wallet className="size-4" />,
      label: dict.nav.financials,
    },
    {
      href: "/personal-finance",
      icon: <Wallet2 className="size-4" />,
      label: dict.nav.personalFinance,
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
              "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 [&_svg]:shrink-0",
              active
                ? "bg-gradient-to-r from-violet-200/80 to-purple-100/90 text-violet-950 shadow-sm ring-1 ring-violet-300/60 [&_svg]:text-violet-800"
                : "text-sidebar-foreground [&_svg]:text-violet-600 hover:bg-white/55 hover:ring-1 hover:ring-violet-200/50"
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

function MobileSettingsSheet({
  userLabel,
  photoUrl,
  triggerClassName,
}: {
  userLabel: string
  photoUrl?: string | null
  triggerClassName?: string
}) {
  const { dict, locale, setLocale } = useI18n()
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={triggerClassName ? "icon-lg" : "icon-sm"}
        className={cn("shrink-0 rounded-xl", triggerClassName)}
        onClick={() => setOpen(true)}
        aria-label={dict.common.settings}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Settings
          className={triggerClassName ? "size-[1.125rem]" : "size-4"}
          strokeWidth={2}
          aria-hidden
        />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          swipeFromLeft
          className="gap-0 overflow-hidden rounded-r-[1.875rem] border-e border-border/50 p-0 shadow-2xl sm:max-w-sm sm:rounded-r-[2.125rem]"
          showCloseButton
        >
          <SheetHeader className="border-b px-6 py-4 text-start">
            <SheetTitle className="text-start">{dict.common.welcome}</SheetTitle>
            <div className="mt-2 flex items-center gap-3">
              <UserAvatar photoUrl={photoUrl} label={userLabel} sizeClassName="size-12 text-lg" />
              <SheetDescription className="m-0 flex-1 text-start text-base font-semibold text-foreground">
                {userLabel}
              </SheetDescription>
            </div>
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
            <Link
              href="/personal-finance"
              className="flex h-11 items-center gap-2 rounded-xl border border-violet-200/70 bg-violet-50/50 px-4 text-sm font-medium text-violet-950 hover:bg-violet-100/70"
              onClick={() => setOpen(false)}
            >
              <Wallet2 className="size-4 shrink-0" aria-hidden />
              {dict.nav.personalFinance}
            </Link>
            <Separator />
            <AccountDataSection onAfterClose={() => setOpen(false)} />
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
    { href: "/dashboard", label: dict.nav.dashboard, icon: <House className="size-5" strokeWidth={2.25} /> },
    { href: "/projects", label: dict.nav.projects, icon: <FolderKanban className="size-5" /> },
    { href: "/customers", label: dict.nav.customers, icon: <Users className="size-5" /> },
    { href: "/tasks", label: dict.nav.tasks, icon: <ListTodo className="size-5" strokeWidth={2.25} /> },
    { href: "/financials", label: dict.nav.financials, icon: <Wallet className="size-5" /> },
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    if (href === "/projects")
      return (
        pathname === "/projects" ||
        Boolean(pathname?.startsWith("/projects/") && pathname !== "/projects/new")
      )
    if (href === "/customers") return pathname === "/customers"
    if (href === "/tasks") return pathname === "/tasks"
    if (href === "/financials") return pathname === "/financials"
    return pathname === href
  }

  const newProjectActive = pathname === "/projects/new"

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 md:hidden">
      <div className="mx-auto max-w-3xl px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
        <div className="relative">
          <Link
            href="/projects/new"
            aria-label={dict.nav.newProject}
            className="group absolute bottom-[calc(100%+10px)] right-3 z-30 flex flex-col items-center gap-1.5 sm:right-5"
          >
            <span
              className={cn(
                "grid size-[3.25rem] place-items-center rounded-full text-white shadow-[0_10px_28px_rgba(109,40,217,0.5)] ring-4 ring-background transition-transform duration-200 active:scale-[0.96]",
                newProjectActive
                  ? "bg-gradient-to-br from-violet-600 to-purple-700"
                  : "bg-gradient-to-br from-violet-500 to-purple-600 group-hover:from-violet-600 group-hover:to-purple-700"
              )}
            >
              <Plus className="size-7 shrink-0 stroke-[2.5]" aria-hidden />
            </span>
            <span
              className={cn(
                "max-w-[5rem] px-0.5 text-center text-[9px] font-semibold leading-snug text-balance text-foreground drop-shadow-sm",
                newProjectActive ? "text-violet-700" : "text-zinc-600 group-hover:text-violet-600"
              )}
            >
              {dict.nav.newProject}
            </span>
          </Link>

          <div className="rounded-full border border-violet-200/70 bg-white/95 px-1.5 pb-1.5 pt-3 shadow-[0_12px_44px_rgba(91,33,182,0.2)] backdrop-blur-xl">
            <div className="grid w-full grid-cols-5 items-end gap-0.5" dir="rtl">
              {items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 rounded-full px-1 py-2 text-[10px] leading-none font-medium transition-all duration-200",
                      active
                        ? "bg-gradient-to-b from-violet-100 to-violet-50 text-violet-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                        : "text-zinc-400 hover:text-violet-600"
                    )}
                  >
                    {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, {
                      className: cn(
                        (item.icon as React.ReactElement<{ className?: string }>).props.className,
                        "size-5 shrink-0",
                        active ? "text-violet-600" : "text-current"
                      ),
                    })}
                    <span className="max-w-full truncate px-0.5">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { dict } = useI18n()
  const { user } = useAuth()
  const { projects, loading: projectsLoading } = useProjects()
  const { transactions, loading: txLoading } = useAllTransactions()
  const { customers } = useCustomers()
  const { tasks: generalTasks } = useGeneralTasks()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const dataLoading = projectsLoading || txLoading

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return
      e.preventDefault()
      setSearchOpen(true)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

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
      <div
        className={cn(
          "hud-surface p-5",
          "border-violet-300/55 bg-gradient-to-b from-white/95 via-violet-50/50 to-purple-50/35 backdrop-blur-md",
          "shadow-[0_20px_56px_-20px_rgba(91,33,182,0.22)]"
        )}
      >
        <div className="flex items-center justify-center">
          <AppLogo alt={dict.appName} className="size-36 rounded-3xl shadow-md shadow-violet-900/10" />
        </div>
        <div className="mt-3 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <UserAvatar photoUrl={user?.photoURL} label={userLabel} sizeClassName="size-10" />
          <span className="min-w-0 text-start">
            {dict.common.welcome}{" "}
            <span className="font-medium text-violet-950/90">{userLabel}</span>
          </span>
        </div>
        <Separator className="my-4 bg-violet-200/50" />
        <Button
          type="button"
          variant="outline"
          className="mb-3 h-11 w-full justify-start gap-2 rounded-full border-violet-300/70 bg-white/70 shadow-sm backdrop-blur-sm hover:bg-violet-50/90"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-4" />
          {dict.search.title}
        </Button>
        <SidebarNav />
        <Separator className="my-4 bg-violet-200/50" />
        <AccountDataSection variant="compact" className="px-0.5" />
        <Separator className="my-4 bg-violet-200/50" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <LogoutButton />
        </div>
      </div>
    </aside>
  )

  const content = (
    <div className="relative isolate flex min-w-0 flex-1 flex-col bg-background">
      {/*
        Mobile: purple chrome + SVG wave. Do not pull `main` upward with negative margin — it paints
        over the wave (z-20 + bg-background) and hides the curve as a flat band. Hero overlap is
        handled on the dashboard only (--mobile-hero-overlap).
      */}
      <header
        className="relative z-10 shrink-0 overflow-hidden px-4 pb-24 pt-[max(1.125rem,env(safe-area-inset-top))] shadow-[0_10px_36px_-6px_rgba(76,29,149,0.32)] md:hidden"
        dir="rtl"
      >
        <SplashStyleBackdrop className="absolute inset-0" />
        <div className="relative z-[3] flex min-w-0 w-full items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center rounded-2xl outline-none ring-2 ring-white/35 ring-offset-2 ring-offset-transparent focus-visible:ring-white/60"
          >
            <AppLogo alt={dict.appName} className="size-11 rounded-2xl shadow-md shadow-black/15" />
          </Link>
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <SmartSearchTrigger
              chrome="mobilePurple"
              ariaLabel={dict.search.title}
              onClick={() => setSearchOpen(true)}
            />
            <DeadlineNotificationsButton {...notifyProps} className={MOBILE_TOP_GLASS_BTN} />
            <MobileSettingsSheet
              userLabel={userLabel}
              photoUrl={user?.photoURL}
              triggerClassName={MOBILE_TOP_GLASS_BTN}
            />
          </div>
        </div>
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[4.75rem] w-full sm:h-[5.25rem]"
          viewBox="0 0 1200 88"
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* Translucent violet layer on chrome */}
          <path
            className="fill-violet-200/50"
            d="M0,40 C168,6 336,70 504,36 C672,8 816,62 984,30 C1060,18 1130,46 1200,36 L1200,88 L0,88 Z"
          />
          {/* Wave cap — same token as page bg so no harsh white strip vs lavender */}
          <path
            className="fill-background"
            d="M0,48 C140,14 280,68 420,38 C560,12 700,58 840,32 C960,10 1080,52 1200,42 L1200,88 L0,88 Z"
          />
        </svg>
      </header>
      <div className="hidden md:flex justify-start px-5 rtl:justify-end md:px-8 md:pt-6">
        <DeadlineNotificationsButton
          {...notifyProps}
          className="rounded-full border border-violet-200/70 bg-white/75 shadow-md shadow-violet-900/5 backdrop-blur-sm"
        />
      </div>
      <main className="relative z-0 flex max-md:z-[11] flex-1 flex-col bg-background px-5 pb-28 max-md:px-4 max-md:pb-36 max-md:pt-4 md:px-8 md:pb-0 md:pt-6">
        {children}
      </main>
    </div>
  )

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="relative flex w-full">
        {/* Keep sidebar first: with dir=rtl it appears right, with dir=ltr it appears left */}
        {sidebar}
        {content}
      </div>

      <MobileBottomNav />
      <SmartSearchPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        projects={projects}
        customers={customers}
        transactions={transactions}
        tasks={generalTasks}
      />
    </div>
  )
}


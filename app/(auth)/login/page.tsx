"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth"
import { Eye, EyeOff } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { GoogleIcon } from "@/components/auth/GoogleIcon"
import { useI18n } from "@/components/i18n/I18nProvider"
import { clientAuth } from "@/lib/firebase/client"
import { SubmitButton } from "@/components/ui/submit-button"
import { useAuth } from "@/components/auth/AuthProvider"
import { PageDeveloperCredit } from "@/components/shell/PageDeveloperCredit"
import { SplashStyleBackdrop, SplashStyleLogoHero } from "@/components/shell/splash-shared"
import {
  authGlassInputClass,
  authGlassLabelClass,
  authGlassSeparatorClass,
  authGlassShellClass,
} from "@/components/auth/authGlassClasses"
import { cn } from "@/lib/utils"

const loginFieldClass = cn(
  authGlassInputClass,
  "h-9 rounded-2xl px-3 py-0 text-sm placeholder:text-sm"
)

export default function LoginPage() {
  const { dict } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)
  const [resetOpen, setResetOpen] = React.useState(false)
  const [resetEmail, setResetEmail] = React.useState("")
  const [resetSending, setResetSending] = React.useState(false)
  const [resetFeedback, setResetFeedback] = React.useState<
    null | { type: "ok" | "err"; text: string }
  >(null)
  const busy = submitting || googleLoading

  React.useEffect(() => {
    if (loading) return
    if (user) {
      const next = searchParams.get("next") || "/dashboard"
      router.replace(next)
    }
  }, [user, loading, router, searchParams])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const auth = clientAuth()
      if (!auth) throw new Error(dict.login.firebaseNotConfigured)
      await signInWithEmailAndPassword(auth, email.trim(), password)
      const next = searchParams.get("next") || "/dashboard"
      router.replace(next)
    } catch (err: any) {
      setError(err?.message ?? "Login failed")
    } finally {
      setSubmitting(false)
    }
  }

  async function onGoogleSignIn() {
    setError(null)
    setGoogleLoading(true)
    try {
      const auth = clientAuth()
      if (!auth) throw new Error(dict.login.firebaseNotConfigured)
      const provider = new GoogleAuthProvider()
      provider.addScope("profile")
      provider.addScope("email")
      provider.setCustomParameters({ prompt: "select_account" })
      await signInWithPopup(auth, provider)
      const next = searchParams.get("next") || "/dashboard"
      router.replace(next)
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : ""
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return
      }
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(dict.login.googleSignInFailed)
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  function openPasswordReset() {
    setResetEmail(email.trim())
    setResetFeedback(null)
    setResetOpen(true)
  }

  async function onSendPasswordReset() {
    const trimmed = resetEmail.trim()
    if (!trimmed) {
      setResetFeedback({ type: "err", text: dict.login.resetEmailRequired })
      return
    }
    setResetSending(true)
    setResetFeedback(null)
    try {
      const auth = clientAuth()
      if (!auth) throw new Error(dict.login.firebaseNotConfigured)
      await sendPasswordResetEmail(auth, trimmed)
      setResetFeedback({ type: "ok", text: dict.login.resetEmailSent })
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : dict.login.resetPasswordFailed
      setResetFeedback({ type: "err", text: msg })
    } finally {
      setResetSending(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-x-hidden">
      <SplashStyleBackdrop />
      <div
        className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-30 sm:left-6"
        dir="ltr"
      >
        <div className="rounded-full border border-white/20 bg-white/15 p-0.5 shadow-lg backdrop-blur-md">
          <LanguageSwitcher iconOnly />
        </div>
      </div>
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,calc(env(safe-area-inset-top)+2.75rem))] sm:px-4 sm:pb-8 sm:pt-6">
        <div className="w-full max-w-[min(21rem,calc(100vw-1.25rem))] space-y-2.5 sm:max-w-sm">
        <div
          className={cn(
            authGlassShellClass,
            "rounded-2xl px-3 py-3.5 sm:px-4 sm:py-4"
          )}
        >
          <div className="flex flex-col items-center gap-2 pb-4 sm:gap-3 sm:pb-5">
            <SplashStyleLogoHero alt={dict.appName} logoClassName="splash-logo-enter" />
            <h1 className="text-center text-2xl font-bold tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.2)] sm:text-3xl">
              {dict.appName}
            </h1>
          </div>

          <div className="space-y-3 border-t border-white/20 pt-3">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold tracking-tight text-white">{dict.login.title}</h2>
              <p className="text-[0.6875rem] leading-snug text-white/75 sm:text-xs">{dict.login.subtitle}</p>
            </div>

            <div className="space-y-2.5">
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full gap-2 rounded-full border-white/35 bg-white/10 text-xs font-medium text-white shadow-none backdrop-blur-sm hover:bg-white/20 hover:text-white sm:text-sm"
              disabled={busy}
              onClick={() => void onGoogleSignIn()}
            >
              <GoogleIcon className="size-4 shrink-0 sm:size-[1.125rem]" />
              {googleLoading ? "…" : dict.login.continueWithGoogle}
            </Button>

            {error ? (
              <div className="text-xs font-medium leading-snug text-red-200" role="alert">
                {error}
              </div>
            ) : null}

            <div className="relative flex items-center py-0.5">
              <Separator className={cn("flex-1", authGlassSeparatorClass)} />
              <span className="max-w-[11rem] shrink px-2 text-center text-[0.65rem] font-medium leading-tight text-white/65 sm:max-w-none sm:px-3 sm:text-xs">
                {dict.login.orContinueWithEmail}
              </span>
              <Separator className={cn("flex-1", authGlassSeparatorClass)} />
            </div>

            <form onSubmit={onSubmit} className="space-y-2.5">
              <div className="space-y-1">
                <Label htmlFor="email" className={cn(authGlassLabelClass, "text-xs")}>
                  {dict.login.email}
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dict.login.emailPlaceholder}
                  disabled={busy}
                  className={loginFieldClass}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className={cn(authGlassLabelClass, "text-xs")}>
                  {dict.login.password}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={dict.login.passwordPlaceholder}
                    className={cn("pe-10", loginFieldClass)}
                    disabled={busy}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute end-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-lg text-white/70 hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-40"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? dict.login.hidePassword : dict.login.showPassword}
                    aria-pressed={showPassword}
                    disabled={busy}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
                <div className="flex justify-end pt-0.5">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto px-0 py-0 text-xs font-medium text-cyan-100/95 underline-offset-4 hover:text-white hover:no-underline"
                    disabled={busy}
                    onClick={openPasswordReset}
                  >
                    {dict.login.forgotPassword}
                  </Button>
                </div>
                {dict.login.hint ? (
                  <div className="text-[0.65rem] text-white/55 sm:text-xs">{dict.login.hint}</div>
                ) : null}
              </div>

              <SubmitButton
                className="h-9 w-full rounded-full border border-white/40 bg-gradient-to-r from-white via-violet-50 to-cyan-100 text-xs font-semibold text-violet-900 shadow-lg hover:brightness-105 disabled:opacity-60 sm:text-sm"
                disabled={busy}
              >
                {submitting ? "..." : dict.login.submit}
              </SubmitButton>
            </form>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/85 sm:text-sm">
          <Link
            href="/register"
            className="font-semibold text-white underline-offset-4 hover:underline"
          >
            {dict.login.createAccount}
          </Link>
        </p>

        <PageDeveloperCredit variant="auth" />

        <Sheet
          open={resetOpen}
          onOpenChange={(open) => {
            setResetOpen(open)
            if (!open) setResetFeedback(null)
          }}
        >
          <SheetContent side="center" className="gap-0 p-0 sm:max-w-md" showCloseButton>
            <SheetHeader className="border-b px-6 py-4 text-start">
              <SheetTitle className="text-start">{dict.login.resetPasswordTitle}</SheetTitle>
              <SheetDescription className="text-start">{dict.login.resetPasswordDescription}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-6 py-5">
              {resetFeedback?.type === "ok" ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{resetFeedback.text}</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">{dict.login.email}</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder={dict.login.emailPlaceholder}
                      disabled={resetSending}
                    />
                  </div>
                  {resetFeedback?.type === "err" ? (
                    <p className="text-sm text-destructive" role="alert">
                      {resetFeedback.text}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    className="h-11 w-full"
                    disabled={resetSending}
                    onClick={() => void onSendPasswordReset()}
                  >
                    {resetSending ? "…" : dict.login.sendResetLink}
                  </Button>
                </>
              )}
            </div>
            {resetFeedback?.type === "ok" ? (
              <SheetFooter className="border-t px-6 py-4 sm:flex-row">
                <Button type="button" className="w-full" variant="secondary" onClick={() => setResetOpen(false)}>
                  {dict.login.resetPasswordClose}
                </Button>
              </SheetFooter>
            ) : null}
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </div>
  )
}


"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { Eye, EyeOff } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { useI18n } from "@/components/i18n/I18nProvider"
import { clientAuth } from "@/lib/firebase/client"
import { SubmitButton } from "@/components/ui/submit-button"
import { useAuth } from "@/components/auth/AuthProvider"
import { PageDeveloperCredit } from "@/components/shell/PageDeveloperCredit"
import { SplashStyleBackdrop, SplashStyleLogoHero } from "@/components/shell/splash-shared"
import {
  authGlassInputClass,
  authGlassLabelClass,
  authGlassShellClass,
} from "@/components/auth/authGlassClasses"
import { cn } from "@/lib/utils"

const registerFieldClass = cn(
  authGlassInputClass,
  "h-9 rounded-2xl px-3 py-0 text-sm placeholder:text-sm"
)

export default function RegisterPage() {
  const { dict } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

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

    const trimmed = email.trim()
    if (password.length < 6) {
      setError(dict.register.passwordTooShort)
      return
    }
    if (password !== confirmPassword) {
      setError(dict.register.passwordMismatch)
      return
    }

    setSubmitting(true)
    try {
      const auth = clientAuth()
      if (!auth) throw new Error(dict.login.firebaseNotConfigured)
      await createUserWithEmailAndPassword(auth, trimmed, password)
      const next = searchParams.get("next") || "/dashboard"
      router.replace(next)
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : ""
      if (code === "auth/email-already-in-use" || code === "auth/weak-password") {
        setError(dict.register.signUpFailed)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(dict.register.signUpFailed)
      }
    } finally {
      setSubmitting(false)
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
              <h2 className="text-base font-semibold tracking-tight text-white">{dict.register.title}</h2>
              <p className="text-[0.6875rem] leading-snug text-white/75 sm:text-xs">{dict.register.subtitle}</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-2.5">
              <div className="space-y-1">
                <Label htmlFor="reg-email" className={cn(authGlassLabelClass, "text-xs")}>
                  {dict.register.email}
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dict.register.emailPlaceholder}
                  disabled={submitting}
                  className={registerFieldClass}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reg-password" className={cn(authGlassLabelClass, "text-xs")}>
                  {dict.register.password}
                </Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={dict.register.passwordPlaceholder}
                    className={cn("pe-10", registerFieldClass)}
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute end-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-lg text-white/70 hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-40"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? dict.login.hidePassword : dict.login.showPassword}
                    aria-pressed={showPassword}
                    disabled={submitting}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="reg-confirm" className={cn(authGlassLabelClass, "text-xs")}>
                  {dict.register.confirmPassword}
                </Label>
                <div className="relative">
                  <Input
                    id="reg-confirm"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={dict.register.confirmPasswordPlaceholder}
                    className={cn("pe-10", registerFieldClass)}
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute end-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-lg text-white/70 hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-40"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? dict.login.hidePassword : dict.login.showPassword}
                    aria-pressed={showConfirm}
                    disabled={submitting}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>

              {error ? (
                <div className="text-xs font-medium leading-snug text-red-200" role="alert">
                  {error}
                </div>
              ) : null}

              <SubmitButton
                className="h-9 w-full rounded-full border border-white/40 bg-gradient-to-r from-white via-violet-50 to-cyan-100 text-xs font-semibold text-violet-900 shadow-lg hover:brightness-105 disabled:opacity-60 sm:text-sm"
                disabled={submitting}
              >
                {submitting ? dict.register.signingUp : dict.register.submit}
              </SubmitButton>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-white/85 sm:text-sm">
          {dict.register.haveAccount}{" "}
          <Link href="/login" className="font-semibold text-white underline-offset-4 hover:underline">
            {dict.register.signIn}
          </Link>
        </p>

        <PageDeveloperCredit variant="auth" />
        </div>
      </div>
    </div>
  )
}

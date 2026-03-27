"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { Eye, EyeOff } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { useI18n } from "@/components/i18n/I18nProvider"
import { clientAuth } from "@/lib/firebase/client"
import { SubmitButton } from "@/components/ui/submit-button"
import { useAuth } from "@/components/auth/AuthProvider"

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
    <div className="relative flex min-h-[100svh] items-center justify-center bg-muted/30 px-4 py-10">
      <div className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-10 sm:left-6">
        <LanguageSwitcher iconOnly />
      </div>
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-center">
          <img src="/logo.svg" alt={dict.appName} className="size-40 rounded-3xl" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight">{dict.register.title}</CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">{dict.register.subtitle}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="reg-email">{dict.register.email}</Label>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dict.register.emailPlaceholder}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">{dict.register.password}</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={dict.register.passwordPlaceholder}
                    className="pe-12"
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-xl text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? dict.login.hidePassword : dict.login.showPassword}
                    aria-pressed={showPassword}
                    disabled={submitting}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm">{dict.register.confirmPassword}</Label>
                <div className="relative">
                  <Input
                    id="reg-confirm"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={dict.register.confirmPasswordPlaceholder}
                    className="pe-12"
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-xl text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? dict.login.hidePassword : dict.login.showPassword}
                    aria-pressed={showConfirm}
                    disabled={submitting}
                  >
                    {showConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </Button>
                </div>
              </div>

              {error ? (
                <div className="text-sm text-destructive" role="alert">
                  {error}
                </div>
              ) : null}

              <SubmitButton className="h-11 w-full text-base" disabled={submitting}>
                {submitting ? dict.register.signingUp : dict.register.submit}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {dict.register.haveAccount}{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            {dict.register.signIn}
          </Link>
        </p>
      </div>
    </div>
  )
}

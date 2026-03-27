"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { useI18n } from "@/components/i18n/I18nProvider"
import { clientAuth } from "@/lib/firebase/client"
import { SubmitButton } from "@/components/ui/submit-button"
import { useAuth } from "@/components/auth/AuthProvider"

export default function LoginPage() {
  const { dict } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
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
    setSubmitting(true)
    try {
      const auth = clientAuth()
      if (!auth) throw new Error("Firebase not configured")
      await signInWithEmailAndPassword(auth, email.trim(), password)
      const next = searchParams.get("next") || "/dashboard"
      router.replace(next)
    } catch (err: any) {
      setError(err?.message ?? "Login failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <div className="grid grid-cols-3 items-center">
          <div />
          <div className="flex justify-center">
            <img src="/logo.svg" alt={dict.appName} className="size-40 rounded-3xl" />
          </div>
          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{dict.login.title}</CardTitle>
            <div className="text-sm text-muted-foreground">{dict.login.subtitle}</div>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{dict.login.email}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{dict.login.password}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <div className="text-xs text-muted-foreground">{dict.login.hint}</div>
              </div>

              {error ? <div className="text-sm text-destructive">{error}</div> : null}

              <SubmitButton className="h-11 w-full text-base">
                {submitting ? "..." : dict.login.submit}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


"use client"

import * as React from "react"
import { signOut } from "firebase/auth"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/components/i18n/I18nProvider"
import { clientAuth } from "@/lib/firebase/client"

export function LogoutButton({ className }: { className?: string }) {
  const { dict } = useI18n()
  const [loading, setLoading] = React.useState(false)

  async function onLogout() {
    if (loading) return
    setLoading(true)
    try {
      const auth = clientAuth()
      if (!auth) throw new Error("Firebase not configured")
      await signOut(auth)
    } catch (e) {
      console.error("[auth] logout failed", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("gap-2", className)}
      onClick={onLogout}
      disabled={loading}
    >
      <LogOut />
      {dict.nav.logout}
    </Button>
  )
}


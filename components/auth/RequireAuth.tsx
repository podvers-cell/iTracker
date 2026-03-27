"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/AuthProvider"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (loading) return
    if (!user) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : ""
      router.replace(`/login${next}`)
    }
  }, [user, loading, router, pathname])

  if (loading) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!user) return null
  return <>{children}</>
}


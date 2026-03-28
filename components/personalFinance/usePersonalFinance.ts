"use client"

import * as React from "react"

import { useAuth } from "@/components/auth/AuthProvider"
import type { PersonalFinanceItem } from "@/lib/data/personalFinance"
import { getPersonalFinanceItems } from "@/lib/data/personalFinance"

export function usePersonalFinance() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = React.useState<PersonalFinanceItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const latestLoadId = React.useRef(0)

  const runLoad = React.useCallback(async () => {
    if (authLoading) return
    const uid = user?.uid
    if (!uid) {
      setItems([])
      setLoading(false)
      setError(null)
      return
    }

    const id = ++latestLoadId.current
    setLoading(true)
    setError(null)
    try {
      const data = await getPersonalFinanceItems(uid)
      if (latestLoadId.current !== id) return
      setItems(data)
    } catch (e: unknown) {
      if (latestLoadId.current !== id) return
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      if (latestLoadId.current === id) setLoading(false)
    }
  }, [user?.uid, authLoading])

  React.useEffect(() => {
    void runLoad()
  }, [runLoad])

  React.useEffect(() => {
    const onOnline = () => void runLoad()
    window.addEventListener("online", onOnline)
    return () => window.removeEventListener("online", onOnline)
  }, [runLoad])

  const refresh = React.useCallback(() => void runLoad(), [runLoad])

  return { items, loading: authLoading || loading, error, refresh }
}

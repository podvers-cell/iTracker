"use client"

import * as React from "react"

import { useAuth } from "@/components/auth/AuthProvider"
import type { Customer } from "@/lib/data/customers"
import { getCustomers } from "@/lib/data/customers"

export function useCustomers() {
  const { user, loading: authLoading } = useAuth()
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const latestLoadId = React.useRef(0)

  const runLoad = React.useCallback(async () => {
    if (authLoading) return
    const uid = user?.uid
    if (!uid) {
      setCustomers([])
      setLoading(false)
      setError(null)
      return
    }

    const id = ++latestLoadId.current
    setLoading(true)
    setError(null)
    try {
      const data = await getCustomers(uid)
      if (latestLoadId.current !== id) return
      setCustomers(data)
    } catch (e: unknown) {
      if (latestLoadId.current !== id) return
      setError(e instanceof Error ? e.message : "Failed to load customers")
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

  return { customers, loading: authLoading || loading, error, refresh }
}

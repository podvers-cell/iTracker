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

  const refresh = React.useCallback(async () => {
    if (authLoading) return
    const uid = user?.uid
    if (!uid) {
      setCustomers([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await getCustomers(uid)
      setCustomers(data)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load customers")
    } finally {
      setLoading(false)
    }
  }, [user?.uid, authLoading])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  return { customers, loading: authLoading || loading, error, refresh }
}

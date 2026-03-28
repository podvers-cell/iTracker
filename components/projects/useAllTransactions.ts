"use client"

import * as React from "react"

import { useAuth } from "@/components/auth/AuthProvider"
import type { Transaction } from "@/lib/data/transactions"
import { getTransactions } from "@/lib/data/transactions"

export function useAllTransactions() {
  const { user, loading: authLoading } = useAuth()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const latestLoadId = React.useRef(0)

  const runLoad = React.useCallback(async () => {
    if (authLoading) return
    const uid = user?.uid
    if (!uid) {
      setTransactions([])
      setLoading(false)
      setError(null)
      return
    }

    const id = ++latestLoadId.current
    setLoading(true)
    setError(null)
    try {
      const data = await getTransactions(uid)
      if (latestLoadId.current !== id) return
      setTransactions(data)
    } catch (e: unknown) {
      if (latestLoadId.current !== id) return
      setError(e instanceof Error ? e.message : "Failed to load transactions")
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

  return { transactions, loading: authLoading || loading, error, refresh }
}

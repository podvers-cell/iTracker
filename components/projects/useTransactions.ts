"use client"

import * as React from "react"

import { useAuth } from "@/components/auth/AuthProvider"
import type { Transaction } from "@/lib/data/transactions"
import { getTransactionsByProject } from "@/lib/data/transactions"

const NO_PROJECT = "__none__"

export function useTransactions(projectId: string) {
  const { user, loading: authLoading } = useAuth()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    if (authLoading) return
    const uid = user?.uid
    if (!uid || !projectId || projectId === NO_PROJECT) {
      setTransactions([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await getTransactionsByProject(uid, projectId)
      setTransactions(data)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }, [projectId, user?.uid, authLoading])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  return { transactions, loading: authLoading || loading, error, refresh }
}

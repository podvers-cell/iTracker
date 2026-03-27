"use client"

import * as React from "react"

import type { Transaction } from "@/lib/data/transactions"
import { getTransactionsByProject } from "@/lib/data/transactions"

export function useTransactions(projectId: string) {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTransactionsByProject(projectId)
      setTransactions(data)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  return { transactions, loading, error, refresh }
}


"use client"

import { useAppData } from "@/components/data/AppDataProvider"

export function useAllTransactions() {
  const d = useAppData()
  return {
    transactions: d.transactions,
    loading: d.authLoading || d.transactionsLoading,
    error: d.transactionsError,
    refresh: d.refreshTransactions,
  }
}

"use client"

import * as React from "react"

import type { Customer } from "@/lib/data/customers"
import { getCustomers } from "@/lib/data/customers"

export function useCustomers() {
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCustomers()
      setCustomers(data)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load customers")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  return { customers, loading, error, refresh }
}

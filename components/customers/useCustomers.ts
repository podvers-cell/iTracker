"use client"

import { useAppData } from "@/components/data/AppDataProvider"

export function useCustomers() {
  const d = useAppData()
  return {
    customers: d.customers,
    loading: d.authLoading || d.customersLoading,
    error: d.customersError,
    refresh: d.refreshCustomers,
  }
}

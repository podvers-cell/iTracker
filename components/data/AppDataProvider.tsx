"use client"

import * as React from "react"

import { useAuth } from "@/components/auth/AuthProvider"
import type { Customer } from "@/lib/data/customers"
import { getCustomers } from "@/lib/data/customers"
import type { GeneralTask } from "@/lib/data/generalTasks"
import { getGeneralTasks } from "@/lib/data/generalTasks"
import type { Project } from "@/lib/data/projects"
import { getProjects } from "@/lib/data/projects"
import type { Transaction } from "@/lib/data/transactions"
import { getTransactions } from "@/lib/data/transactions"

export type AppDataContextValue = {
  authLoading: boolean
  projects: Project[]
  projectsLoading: boolean
  projectsError: string | null
  refreshProjects: () => Promise<void>
  transactions: Transaction[]
  transactionsLoading: boolean
  transactionsError: string | null
  refreshTransactions: () => Promise<void>
  customers: Customer[]
  customersLoading: boolean
  customersError: string | null
  refreshCustomers: () => Promise<void>
  tasks: GeneralTask[]
  tasksLoading: boolean
  tasksError: string | null
  refreshTasks: () => Promise<void>
  /** Reload all four datasets in parallel (e.g. reconnect). */
  refreshAll: () => Promise<void>
}

const AppDataContext = React.createContext<AppDataContextValue | null>(null)

export function useAppData() {
  const ctx = React.useContext(AppDataContext)
  if (!ctx) {
    throw new Error("useAppData must be used within AppDataProvider")
  }
  return ctx
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const uid = user?.uid

  const [projects, setProjects] = React.useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = React.useState(true)
  const [projectsError, setProjectsError] = React.useState<string | null>(null)

  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = React.useState(true)
  const [transactionsError, setTransactionsError] = React.useState<string | null>(null)

  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = React.useState(true)
  const [customersError, setCustomersError] = React.useState<string | null>(null)

  const [tasks, setTasks] = React.useState<GeneralTask[]>([])
  const [tasksLoading, setTasksLoading] = React.useState(true)
  const [tasksError, setTasksError] = React.useState<string | null>(null)

  const loadAllId = React.useRef(0)
  const projectsLoadId = React.useRef(0)
  const txLoadId = React.useRef(0)
  const customersLoadId = React.useRef(0)
  const tasksLoadId = React.useRef(0)

  const refreshProjects = React.useCallback(async () => {
    if (!uid) {
      setProjects([])
      setProjectsLoading(false)
      setProjectsError(null)
      return
    }
    const id = ++projectsLoadId.current
    setProjectsLoading(true)
    setProjectsError(null)
    try {
      const data = await getProjects(uid)
      if (projectsLoadId.current !== id) return
      setProjects(data)
    } catch (e: unknown) {
      if (projectsLoadId.current !== id) return
      setProjectsError(e instanceof Error ? e.message : "Failed to load projects")
    } finally {
      if (projectsLoadId.current === id) setProjectsLoading(false)
    }
  }, [uid])

  const refreshTransactions = React.useCallback(async () => {
    if (!uid) {
      setTransactions([])
      setTransactionsLoading(false)
      setTransactionsError(null)
      return
    }
    const id = ++txLoadId.current
    setTransactionsLoading(true)
    setTransactionsError(null)
    try {
      const data = await getTransactions(uid)
      if (txLoadId.current !== id) return
      setTransactions(data)
    } catch (e: unknown) {
      if (txLoadId.current !== id) return
      setTransactionsError(e instanceof Error ? e.message : "Failed to load transactions")
    } finally {
      if (txLoadId.current === id) setTransactionsLoading(false)
    }
  }, [uid])

  const refreshCustomers = React.useCallback(async () => {
    if (!uid) {
      setCustomers([])
      setCustomersLoading(false)
      setCustomersError(null)
      return
    }
    const id = ++customersLoadId.current
    setCustomersLoading(true)
    setCustomersError(null)
    try {
      const data = await getCustomers(uid)
      if (customersLoadId.current !== id) return
      setCustomers(data)
    } catch (e: unknown) {
      if (customersLoadId.current !== id) return
      setCustomersError(e instanceof Error ? e.message : "Failed to load customers")
    } finally {
      if (customersLoadId.current === id) setCustomersLoading(false)
    }
  }, [uid])

  const refreshTasks = React.useCallback(async () => {
    if (!uid) {
      setTasks([])
      setTasksLoading(false)
      setTasksError(null)
      return
    }
    const id = ++tasksLoadId.current
    setTasksLoading(true)
    setTasksError(null)
    try {
      const data = await getGeneralTasks(uid)
      if (tasksLoadId.current !== id) return
      setTasks(data)
    } catch (e: unknown) {
      if (tasksLoadId.current !== id) return
      setTasksError(e instanceof Error ? e.message : "Failed to load tasks")
    } finally {
      if (tasksLoadId.current === id) setTasksLoading(false)
    }
  }, [uid])

  const refreshAll = React.useCallback(async () => {
    if (authLoading) return
    if (!uid) {
      setProjects([])
      setTransactions([])
      setCustomers([])
      setTasks([])
      setProjectsLoading(false)
      setTransactionsLoading(false)
      setCustomersLoading(false)
      setTasksLoading(false)
      setProjectsError(null)
      setTransactionsError(null)
      setCustomersError(null)
      setTasksError(null)
      return
    }

    const id = ++loadAllId.current
    setProjectsLoading(true)
    setTransactionsLoading(true)
    setCustomersLoading(true)
    setTasksLoading(true)
    setProjectsError(null)
    setTransactionsError(null)
    setCustomersError(null)
    setTasksError(null)

    const results = await Promise.allSettled([
      getProjects(uid),
      getTransactions(uid),
      getCustomers(uid),
      getGeneralTasks(uid),
    ])

    if (loadAllId.current !== id) return

    const [pr, tr, cr, gr] = results

    if (pr.status === "fulfilled") {
      setProjects(pr.value)
    } else {
      const err = pr.reason
      setProjectsError(err instanceof Error ? err.message : "Failed to load projects")
    }
    setProjectsLoading(false)

    if (tr.status === "fulfilled") {
      setTransactions(tr.value)
    } else {
      const err = tr.reason
      setTransactionsError(err instanceof Error ? err.message : "Failed to load transactions")
    }
    setTransactionsLoading(false)

    if (cr.status === "fulfilled") {
      setCustomers(cr.value)
    } else {
      const err = cr.reason
      setCustomersError(err instanceof Error ? err.message : "Failed to load customers")
    }
    setCustomersLoading(false)

    if (gr.status === "fulfilled") {
      setTasks(gr.value)
    } else {
      const err = gr.reason
      setTasksError(err instanceof Error ? err.message : "Failed to load tasks")
    }
    setTasksLoading(false)
  }, [uid, authLoading])

  React.useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  React.useEffect(() => {
    const onOnline = () => void refreshAll()
    window.addEventListener("online", onOnline)
    return () => window.removeEventListener("online", onOnline)
  }, [refreshAll])

  const value = React.useMemo<AppDataContextValue>(
    () => ({
      authLoading,
      projects,
      projectsLoading,
      projectsError,
      refreshProjects,
      transactions,
      transactionsLoading,
      transactionsError,
      refreshTransactions,
      customers,
      customersLoading,
      customersError,
      refreshCustomers,
      tasks,
      tasksLoading,
      tasksError,
      refreshTasks,
      refreshAll,
    }),
    [
      authLoading,
      projects,
      projectsLoading,
      projectsError,
      refreshProjects,
      transactions,
      transactionsLoading,
      transactionsError,
      refreshTransactions,
      customers,
      customersLoading,
      customersError,
      refreshCustomers,
      tasks,
      tasksLoading,
      tasksError,
      refreshTasks,
      refreshAll,
    ]
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

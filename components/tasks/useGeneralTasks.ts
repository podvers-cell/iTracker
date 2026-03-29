"use client"

import { useAppData } from "@/components/data/AppDataProvider"

export function useGeneralTasks() {
  const d = useAppData()
  return {
    tasks: d.tasks,
    loading: d.authLoading || d.tasksLoading,
    error: d.tasksError,
    refresh: d.refreshTasks,
  }
}

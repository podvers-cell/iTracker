"use client"

import { useAppData } from "@/components/data/AppDataProvider"

export function useProjects() {
  const d = useAppData()
  return {
    projects: d.projects,
    loading: d.authLoading || d.projectsLoading,
    error: d.projectsError,
    refresh: d.refreshProjects,
  }
}

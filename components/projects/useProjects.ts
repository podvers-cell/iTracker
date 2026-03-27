"use client"

import * as React from "react"

import { useAuth } from "@/components/auth/AuthProvider"
import type { Project } from "@/lib/data/projects"
import { getProjects } from "@/lib/data/projects"

export function useProjects() {
  const { user, loading: authLoading } = useAuth()
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    if (authLoading) return
    const uid = user?.uid
    if (!uid) {
      setProjects([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await getProjects(uid)
      setProjects(data)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load projects")
    } finally {
      setLoading(false)
    }
  }, [user?.uid, authLoading])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  return { projects, loading: authLoading || loading, error, refresh }
}

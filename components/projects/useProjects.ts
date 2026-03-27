"use client"

import * as React from "react"

import type { Project } from "@/lib/data/projects"
import { getProjects } from "@/lib/data/projects"

export function useProjects() {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProjects()
      setProjects(data)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load projects")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  return { projects, loading, error, refresh }
}


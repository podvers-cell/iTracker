"use client"

import * as React from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function ExpensesRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    const pid = searchParams.get("projectId")
    router.replace(pid ? `/financials?projectId=${encodeURIComponent(pid)}` : "/financials")
  }, [router, searchParams])

  return null
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={null}>
      <ExpensesRedirect />
    </Suspense>
  )
}

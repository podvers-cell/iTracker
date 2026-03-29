import { AppDataProvider } from "@/components/data/AppDataProvider"
import { AppShell } from "@/components/layout/AppShell"
import { RequireAuth } from "@/components/auth/RequireAuth"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppDataProvider>
        <AppShell>{children}</AppShell>
      </AppDataProvider>
    </RequireAuth>
  )
}


"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { deleteUser, signOut } from "firebase/auth"

import { useAuth } from "@/components/auth/AuthProvider"
import { useI18n } from "@/components/i18n/I18nProvider"
import { Button } from "@/components/ui/button"
import {
  buildUserDataExport,
  deleteAllUserFirestoreData,
  downloadJsonFile,
} from "@/lib/data/accountBackup"
import { clientAuth } from "@/lib/firebase/client"
import { cn } from "@/lib/utils"

type Busy = "export" | "copy" | "revoke" | "delete" | null

export function AccountDataSection({
  className,
  onAfterClose,
  variant = "default",
}: {
  className?: string
  /** e.g. close settings sheet after signing out everywhere */
  onAfterClose?: () => void
  variant?: "default" | "compact"
}) {
  const { dict } = useI18n()
  const { user } = useAuth()
  const router = useRouter()
  const a = dict.account
  const [busy, setBusy] = React.useState<Busy>(null)
  const [notice, setNotice] = React.useState<string | null>(null)

  const uid = user?.uid
  const btnClass = variant === "compact" ? "h-9 justify-start text-start text-xs" : "h-11 w-full justify-center"

  React.useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 3500)
    return () => window.clearTimeout(t)
  }, [notice])

  async function onExport() {
    if (!uid || busy) return
    setBusy("export")
    setNotice(null)
    try {
      const data = await buildUserDataExport(uid)
      const d = new Date()
      const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      downloadJsonFile(`itrack-backup-${stamp}.json`, data)
    } catch (e) {
      console.error("[account] export", e)
      setNotice(a.exportError)
    } finally {
      setBusy(null)
    }
  }

  async function onCopy() {
    if (!uid || busy) return
    setBusy("copy")
    setNotice(null)
    try {
      const data = await buildUserDataExport(uid)
      const text = JSON.stringify(data, null, 2)
      await navigator.clipboard.writeText(text)
      setNotice(a.copied)
    } catch (e) {
      console.error("[account] copy", e)
      setNotice(a.exportError)
    } finally {
      setBusy(null)
    }
  }

  async function onRevokeAll() {
    if (!user || busy) return
    setBusy("revoke")
    setNotice(null)
    const auth = clientAuth()
    if (!auth) {
      setNotice(a.revokeError)
      setBusy(null)
      return
    }
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/auth/revoke-all-sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.status === 503) {
        setNotice(a.revokeUnavailable)
        return
      }
      if (!res.ok) {
        setNotice(a.revokeError)
        return
      }
      await signOut(auth)
      onAfterClose?.()
      router.replace("/login")
      router.refresh()
    } catch (e) {
      console.error("[account] revoke", e)
      setNotice(a.revokeError)
    } finally {
      setBusy(null)
    }
  }

  async function onDeleteAccount() {
    if (!user || !uid || busy) return
    if (!window.confirm(a.deleteConfirm)) return
    const typed = window.prompt(a.deleteTypeWord, "")
    if ((typed || "").trim() !== "DELETE") return

    setBusy("delete")
    setNotice(null)
    const auth = clientAuth()
    if (!auth) {
      setNotice(a.deleteError)
      setBusy(null)
      return
    }
    try {
      await deleteAllUserFirestoreData(uid)
      await deleteUser(user)
      await signOut(auth)
      onAfterClose?.()
      router.replace("/login")
      router.refresh()
    } catch (e: unknown) {
      console.error("[account] delete", e)
      const code =
        typeof e === "object" && e && "code" in e ? String((e as { code?: string }).code) : ""
      if (code === "auth/requires-recent-login") {
        setNotice(a.deleteNeedsRecentLogin)
      } else {
        setNotice(a.deleteError)
      }
    } finally {
      setBusy(null)
    }
  }

  if (!user) return null

  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-sm font-medium text-foreground">{a.dataTitle}</div>
      {notice ? (
        <p className="text-xs leading-snug text-muted-foreground" role="status">
          {notice}
        </p>
      ) : null}
      <p className="text-xs leading-snug text-muted-foreground">{a.exportHint}</p>
      <div className={cn("flex flex-col gap-2", variant === "default" && "sm:flex-row sm:flex-wrap")}>
        <Button
          type="button"
          variant="outline"
          className={cn(btnClass, variant === "default" && "sm:flex-1")}
          disabled={Boolean(busy)}
          onClick={() => void onExport()}
        >
          {busy === "export" ? a.working : a.exportJson}
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(btnClass, variant === "default" && "sm:flex-1")}
          disabled={Boolean(busy)}
          onClick={() => void onCopy()}
        >
          {busy === "copy" ? a.working : a.copyJson}
        </Button>
      </div>
      <div className="space-y-1.5">
        <Button
          type="button"
          variant="secondary"
          className={btnClass}
          disabled={Boolean(busy)}
          onClick={() => void onRevokeAll()}
        >
          {busy === "revoke" ? a.working : a.revokeAll}
        </Button>
        <p className="text-[11px] leading-snug text-muted-foreground">{a.revokeHint}</p>
      </div>
      <div className="space-y-1.5 border-t border-border/60 pt-3">
        <Button
          type="button"
          variant="destructive"
          className={btnClass}
          disabled={Boolean(busy)}
          onClick={() => void onDeleteAccount()}
        >
          {busy === "delete" ? a.deleting : a.deleteButton}
        </Button>
        <p className="text-[11px] leading-snug text-muted-foreground">{a.deleteHint}</p>
      </div>
    </div>
  )
}

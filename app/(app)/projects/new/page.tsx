"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, FolderPlus } from "lucide-react"

import { useI18n } from "@/components/i18n/I18nProvider"
import { useAuth } from "@/components/auth/AuthProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LinkButton } from "@/components/ui/link-button"
import { SubmitButton } from "@/components/ui/submit-button"
import { createProject } from "@/lib/data/projects"
import { clientAuth, clientDb, firebaseClientApp } from "@/lib/firebase/client"
import { compareISODates, toISODateLocal } from "@/lib/dates/localDate"
import { DateValidationCode } from "@/lib/validation/dateCodes"
import { parseLocalizedAmount } from "@/lib/format/numericInput"
import { DatePickerField } from "@/components/ui/date-picker-field"
import { cn } from "@/lib/utils"

export default function NewProjectPage() {
  const { dict, locale } = useI18n()
  const { user } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [statusOpen, setStatusOpen] = React.useState(false)
  const [statusValue, setStatusValue] = React.useState<"active" | "on_hold" | "completed">("active")
  const statusRef = React.useRef<HTMLDivElement | null>(null)
  const rtl = locale === "ar"

  const todayIso = toISODateLocal(new Date())
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const endMinDate = React.useMemo(() => {
    if (startDate && compareISODates(startDate, todayIso) >= 0) return startDate
    return todayIso
  }, [startDate, todayIso])

  const onStartDateChange = React.useCallback((v: string) => {
    setStartDate(v)
    setEndDate((prev) => (prev && v && compareISODates(prev, v) < 0 ? "" : prev))
  }, [])
  const fieldClass =
    "h-14 rounded-3xl border border-input bg-background/95 px-4 text-base text-foreground placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-primary/25"
  const labelClass = "mb-1 text-xl font-medium text-foreground/90"

  React.useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!statusRef.current) return
      if (!statusRef.current.contains(e.target as Node)) setStatusOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setStatusOpen(false)
    }
    window.addEventListener("mousedown", onPointerDown)
    window.addEventListener("keydown", onEsc)
    return () => {
      window.removeEventListener("mousedown", onPointerDown)
      window.removeEventListener("keydown", onEsc)
    }
  }, [])

  const statusOptions = [
    { value: "active" as const, label: dict.projectNew.statusActive },
    { value: "on_hold" as const, label: dict.projectNew.statusOnHold },
    { value: "completed" as const, label: dict.projectNew.statusCompleted },
  ]
  const selectedStatus = statusOptions.find((o) => o.value === statusValue)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    console.log("[projects/new] submit started")
    e.preventDefault()
    if (submitting) {
      console.log("[projects/new] submit ignored: already submitting")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("[projects/new] current authenticated user", {
        uid: user?.uid ?? null,
        email: user?.email ?? null,
      })

      if (!user) {
        throw new Error("Not authenticated")
      }

      console.log("[projects/new] fetching idToken to ensure auth is ready")
      const tokenResult = await user.getIdTokenResult()
      console.log("[projects/new] idToken fetched", {
        authTime: tokenResult.authTime,
        issuedAtTime: tokenResult.issuedAtTime,
        expirationTime: tokenResult.expirationTime,
        signInProvider: tokenResult.signInProvider,
      })

      // Diagnostics: verify correct Firebase project + auth user + Firestore target.
      try {
        const envProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        const app = firebaseClientApp()
        const auth = clientAuth()
        const db = clientDb()
        const dbProjectId = (db as any)?._databaseId?.projectId ?? (db as any)?.app?.options?.projectId

        console.log("[diag] NEXT_PUBLIC_FIREBASE_PROJECT_ID", envProjectId)
        console.log("[diag] auth.currentUser?.uid", auth?.currentUser?.uid ?? null)
        console.log("[diag] firebase app options.projectId", app?.options?.projectId ?? null)
        console.log("[diag] firestore projectId", dbProjectId ?? null)
      } catch (diagErr) {
        console.warn("[diag] failed to collect firebase diagnostics", diagErr)
      }

      const currentTarget = e.currentTarget
      const target = e.target
      console.log("[projects/new] submit event targets", {
        currentTargetTag: (currentTarget as any)?.tagName,
        targetTag: (target as any)?.tagName,
      })

      const formEl =
        currentTarget instanceof HTMLFormElement
          ? currentTarget
          : target instanceof HTMLFormElement
            ? target
            : null

      if (!formEl) {
        throw new TypeError(
          "Submit handler did not receive an HTMLFormElement (unexpected event target)"
        )
      }

      const formData = new FormData(formEl)
      const name = String(formData.get("name") || "").trim()

      if (!name) {
        throw new Error("Name is required")
      }

      const toNumberOrNull = (v: FormDataEntryValue | null) => {
        if (typeof v !== "string") return null
        const t = v.trim()
        if (!t) return null
        const n = parseLocalizedAmount(t)
        return Number.isFinite(n) ? n : null
      }
      const toStringOrNull = (v: FormDataEntryValue | null) => {
        if (typeof v !== "string") return null
        const t = v.trim()
        return t ? t : null
      }

      const payload = {
        name,
        clientName: toStringOrNull(formData.get("clientName")),
        location: toStringOrNull(formData.get("location")),
        startDate: toStringOrNull(formData.get("startDate")),
        expectedEndDate: toStringOrNull(formData.get("expectedEndDate")),
        contractValue: toNumberOrNull(formData.get("contractValue")),
        collectedAmount: toNumberOrNull(formData.get("collectedAmount")),
        requiredScope: toStringOrNull(formData.get("requiredScope")),
        status: (toStringOrNull(formData.get("status")) as any) ?? "active",
        notes: toStringOrNull(formData.get("notes")),
      }

      console.log("[projects/new] before calling createProject", { payload })

      const uid = user?.uid
      if (!uid) throw new Error("Not signed in")

      const id = await createProject(uid, payload)

      console.log("[projects/new] after createProject returns", { id })
      setSuccess(dict.projectNew.success)

      const nextUrl = `/projects/${id}`
      console.log("[projects/new] before router.push", { nextUrl })
      router.push(nextUrl)
      console.log("[projects/new] after router.push")
    } catch (e: any) {
      console.error("[projects/new] submit error", e)
      const msg =
        e?.code === "permission-denied"
          ? "Firestore: permission-denied (check rules/admin UID)"
          : e?.message === DateValidationCode.PAST_CALENDAR_DATE
            ? dict.common.pastCalendarDateNotAllowed
            : e?.message ?? "Failed to create project"
      setError(msg)
    } finally {
      console.log("[projects/new] submit finally: resetting loading")
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <FolderPlus className="size-7 shrink-0 text-violet-600" aria-hidden />
            {dict.projectNew.title}
          </h1>
          <p className="text-sm text-muted-foreground">{dict.projectNew.helper}</p>
        </div>
        <LinkButton href="/projects" variant="outline" className="h-11 text-base">
          {dict.common.back}
        </LinkButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{dict.projectNew.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className={labelClass}>
                {dict.projectNew.name}
              </Label>
              <Input id="name" name="name" placeholder={dict.projectNew.name} className={fieldClass} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName" className={labelClass}>
                {dict.projectNew.client}
              </Label>
              <Input
                id="clientName"
                name="clientName"
                placeholder={dict.projectNew.client}
                className={fieldClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className={labelClass}>
                {dict.projectNew.location}
              </Label>
              <Input
                id="location"
                name="location"
                placeholder={dict.projectNew.location}
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate" className={labelClass}>
                  {dict.projectNew.startDate}
                </Label>
                <DatePickerField
                  id="startDate"
                  name="startDate"
                  minDate={todayIso}
                  value={startDate}
                  onValueChange={onStartDateChange}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedEndDate" className={labelClass}>
                  {dict.projectNew.expectedEndDate}
                </Label>
                <DatePickerField
                  id="expectedEndDate"
                  name="expectedEndDate"
                  minDate={endMinDate}
                  value={endDate}
                  onValueChange={setEndDate}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contractValue" className={labelClass}>
                  {dict.projectNew.contractValue}
                </Label>
                <Input
                  id="contractValue"
                  name="contractValue"
                  inputMode="decimal"
                  placeholder="0"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collectedAmount" className={labelClass}>
                  {dict.projectNew.collectedAmount}
                </Label>
                <Input
                  id="collectedAmount"
                  name="collectedAmount"
                  inputMode="decimal"
                  placeholder="0"
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className={labelClass}>
                {dict.projectNew.status}
              </Label>
              <div className="space-y-2" ref={statusRef}>
                <input type="hidden" name="status" value={statusValue} />
                <button
                  id="status"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={statusOpen}
                  onClick={() => setStatusOpen((v) => !v)}
                  className={cn(
                    "flex h-14 w-full items-center justify-between rounded-3xl border border-input bg-background/95 px-4 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-primary/25",
                    rtl ? "text-right" : "text-left",
                    statusOpen ? "ring-2 ring-primary/25" : ""
                  )}
                >
                  <span className="truncate">{selectedStatus?.label}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      statusOpen ? "rotate-180" : ""
                    )}
                  />
                </button>

                {statusOpen ? (
                  <div
                    role="listbox"
                    className="relative z-30 mt-2 max-h-64 overflow-auto rounded-2xl border border-border bg-popover p-1 shadow-lg"
                  >
                    {statusOptions.map((option) => {
                      const active = option.value === statusValue
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            setStatusValue(option.value)
                            setStatusOpen(false)
                          }}
                          className={cn(
                            "flex w-full items-center rounded-xl px-3 py-2 text-sm transition-colors",
                            rtl ? "justify-end text-right" : "justify-start text-left",
                            active ? "bg-muted font-medium text-foreground" : "hover:bg-muted/70"
                          )}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredScope" className={labelClass}>
                {dict.projectNew.requiredScope}
              </Label>
              <Textarea
                id="requiredScope"
                name="requiredScope"
                rows={3}
                placeholder={dict.projectNew.requiredScope}
                className="min-h-28 rounded-3xl border border-input bg-background/95 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-primary/25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className={labelClass}>
                {dict.projectNew.notes}
              </Label>
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder={dict.projectNew.notes}
                className="min-h-32 rounded-3xl border border-input bg-background/95 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-primary/25"
              />
            </div>

            <SubmitButton className="h-11 w-full text-base" disabled={submitting}>
              {submitting ? dict.projectNew.saving : dict.projectNew.submit}
            </SubmitButton>
            {error ? <div className="text-sm text-destructive">{error}</div> : null}
            {success ? <div className="text-sm text-foreground">{success}</div> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


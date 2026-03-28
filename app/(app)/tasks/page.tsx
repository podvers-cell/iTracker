"use client"

import * as React from "react"
import { Bell, ListTodo, Pencil, Plus, Trash2 } from "lucide-react"

import { useI18n } from "@/components/i18n/I18nProvider"
import { useAuth } from "@/components/auth/AuthProvider"
import { useGeneralTasks } from "@/components/tasks/useGeneralTasks"
import { useTaskReminderNotifications } from "@/components/tasks/useTaskReminderNotifications"
import {
  addGeneralTask,
  deleteGeneralTaskById,
  dueMomentMs,
  updateGeneralTask,
  type GeneralTask,
  TASK_REMINDER_OFFSET_MINUTES,
} from "@/lib/data/generalTasks"
import { formatISODateForDisplay, toISODateLocal } from "@/lib/dates/localDate"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { DateValidationCode } from "@/lib/validation/dateCodes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SubmitButton } from "@/components/ui/submit-button"
import { Button } from "@/components/ui/button"
import { DatePickerField } from "@/components/ui/date-picker-field"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function reminderOffsetLabel(minutes: number, t: ReturnType<typeof useI18n>["dict"]["tasks"]): string {
  const map: Record<number, string> = {
    0: t.reminderOffset0,
    5: t.reminderOffset5,
    15: t.reminderOffset15,
    30: t.reminderOffset30,
    60: t.reminderOffset60,
    120: t.reminderOffset120,
    1440: t.reminderOffset1440,
  }
  return map[minutes] ?? `${minutes} min`
}

function dateValidationMessage(err: unknown, d: Dictionary): string | null {
  if (!(err instanceof Error)) return null
  if (err.message === DateValidationCode.PAST_CALENDAR_DATE) return d.common.pastCalendarDateNotAllowed
  if (err.message === DateValidationCode.PAST_DATETIME) return d.common.pastDateTimeNotAllowed
  return null
}

function dueUrgency(task: GeneralTask, now: Date): "overdue" | "today" | null {
  if (!task.dueDate || task.done) return null
  const ms = dueMomentMs(task.dueDate, task.dueTime)
  if (ms == null) return null
  const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const eod = sod + 86_399_999
  if (ms < sod) return "overdue"
  if (ms <= eod) return "today"
  return null
}

export default function TasksPage() {
  const { dict, locale } = useI18n()
  const { user } = useAuth()
  const { tasks, loading, error, refresh } = useGeneralTasks()
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  useTaskReminderNotifications(tasks, refresh, {
    reminderNotificationTitle: dict.tasks.reminderNotificationTitle,
  })

  const [addOpen, setAddOpen] = React.useState(false)
  const [editTask, setEditTask] = React.useState<GeneralTask | null>(null)
  const [addDueDate, setAddDueDate] = React.useState("")
  const [addDueTime, setAddDueTime] = React.useState("")
  const [addReminder, setAddReminder] = React.useState(false)
  const [addOffset, setAddOffset] = React.useState(15)
  const [editDueDate, setEditDueDate] = React.useState("")
  const [editDueTime, setEditDueTime] = React.useState("")
  const [editReminder, setEditReminder] = React.useState(false)
  const [editOffset, setEditOffset] = React.useState(15)
  const [editTitle, setEditTitle] = React.useState("")
  const [editNotes, setEditNotes] = React.useState("")

  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const [notifPerm, setNotifPerm] = React.useState<NotificationPermission>(() =>
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  )
  const notifSupported = typeof Notification !== "undefined"

  React.useEffect(() => {
    if (!editTask) return
    setEditTitle(editTask.title)
    setEditNotes(editTask.notes ?? "")
    setEditDueDate(editTask.dueDate ?? "")
    setEditDueTime(editTask.dueTime ?? "")
    setEditReminder(editTask.reminderEnabled)
    setEditOffset(editTask.reminderOffsetMinutes ?? 15)
  }, [editTask])

  React.useEffect(() => {
    if (!addOpen) {
      setAddDueDate("")
      setAddDueTime("")
      setAddReminder(false)
      setAddOffset(15)
    }
  }, [addOpen])

  async function requestNotifications() {
    if (!notifSupported) return
    const p = await Notification.requestPermission()
    setNotifPerm(p)
  }

  async function onAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) {
      setSubmitError("Not authenticated")
      return
    }
    if (saving) return
    const form = e.currentTarget
    setSaving(true)
    setSubmitError(null)
    try {
      const title = String(new FormData(form).get("title") || "").trim()
      const notes = String(new FormData(form).get("notes") || "").trim()
      if (!title) throw new Error(dict.tasks.titleRequired)

      await addGeneralTask(user.uid, {
        title,
        notes: notes || null,
        dueDate: addDueDate.trim() || null,
        dueTime: addDueTime.trim() || null,
        reminderEnabled: addReminder && Boolean(addDueDate.trim()),
        reminderOffsetMinutes: addOffset,
      })

      form.reset()
      setAddDueDate("")
      setAddDueTime("")
      setAddReminder(false)
      setAddOffset(15)
      await refresh()
      setAddOpen(false)
    } catch (err: unknown) {
      setSubmitError(dateValidationMessage(err, dict) ?? (err instanceof Error ? err.message : dict.tasks.saveFailed))
    } finally {
      setSaving(false)
    }
  }

  async function onEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user || !editTask) return
    if (saving) return
    setSaving(true)
    setSubmitError(null)
    try {
      const title = editTitle.trim()
      if (!title) throw new Error(dict.tasks.titleRequired)

      await updateGeneralTask(editTask.id, {
        title,
        notes: editNotes.trim() || null,
        dueDate: editDueDate.trim() || null,
        dueTime: editDueTime.trim() || null,
        reminderEnabled: editReminder && Boolean(editDueDate.trim()),
        reminderOffsetMinutes: editOffset,
      })

      await refresh()
      setEditTask(null)
    } catch (err: unknown) {
      setSubmitError(dateValidationMessage(err, dict) ?? (err instanceof Error ? err.message : dict.tasks.saveFailed))
    } finally {
      setSaving(false)
    }
  }

  async function onToggleDone(taskId: string, done: boolean) {
    if (!user || togglingId) return
    setTogglingId(taskId)
    try {
      await updateGeneralTask(taskId, { done })
      await refresh()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : dict.tasks.saveFailed)
    } finally {
      setTogglingId(null)
    }
  }

  async function onDelete(taskId: string) {
    const ok = window.confirm(dict.tasks.confirmDelete)
    if (!ok || deletingId) return
    setDeletingId(taskId)
    try {
      await deleteGeneralTaskById(taskId)
      await refresh()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : dict.tasks.deleteFailed)
    } finally {
      setDeletingId(null)
    }
  }

  const offsetSelect = (
    value: number,
    onChange: (v: number) => void,
    disabled: boolean,
    id: string
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{dict.tasks.reminderBefore}</Label>
      <select
        id={id}
        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:opacity-50"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {TASK_REMINDER_OFFSET_MINUTES.map((m) => (
          <option key={m} value={m}>
            {reminderOffsetLabel(m, dict.tasks)}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ListTodo className="size-7 shrink-0 text-violet-600" strokeWidth={2} aria-hidden />
            {dict.tasks.title}
          </h1>
          <p className="text-sm text-muted-foreground">{dict.tasks.subtitle}</p>
        </div>
        <Button
          type="button"
          className="h-11 shrink-0 gap-2"
          onClick={() => {
            setSubmitError(null)
            setAddOpen(true)
          }}
        >
          <Plus className="size-4" />
          {dict.tasks.addNew}
        </Button>
      </div>

      {notifSupported ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/15 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bell className="size-4 shrink-0 text-violet-600" aria-hidden />
            <span>
              {notifPerm === "granted"
                ? dict.tasks.notificationsOn
                : notifPerm === "denied"
                  ? dict.tasks.notificationsDenied
                  : dict.tasks.enableNotifications}
            </span>
          </div>
          {notifPerm === "default" ? (
            <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={requestNotifications}>
              {dict.tasks.enableNotifications}
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{dict.tasks.notificationsUnsupported}</p>
      )}

      <Sheet
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (!open) setSubmitError(null)
        }}
      >
        <SheetContent side="center" className="gap-0 p-0 sm:w-full" showCloseButton>
          <SheetHeader className="border-b px-6 py-4 text-start">
            <SheetTitle>{dict.tasks.add}</SheetTitle>
            <SheetDescription className="text-start">{dict.tasks.addSheetHint}</SheetDescription>
          </SheetHeader>
          <div className="max-h-[min(85dvh,640px)] overflow-y-auto px-6 py-4">
            <form className="space-y-4" onSubmit={onAddSubmit}>
              <div className="space-y-2">
                <Label htmlFor="task-title">{dict.tasks.taskTitle}</Label>
                <Input id="task-title" name="title" placeholder={dict.tasks.taskTitle} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-notes">{dict.tasks.notes}</Label>
                <Textarea
                  id="task-notes"
                  name="notes"
                  placeholder={dict.tasks.notesOptional}
                  rows={3}
                  className="min-h-[5rem] resize-y"
                />
              </div>
              <div className="border-t border-border pt-4">
                <p className="mb-3 text-sm font-medium">{dict.tasks.dueSection}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{dict.tasks.dueDate}</Label>
                    <DatePickerField
                      name="dueDate"
                      value={addDueDate}
                      onValueChange={setAddDueDate}
                      minDate={toISODateLocal(now)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-due-time">{dict.tasks.dueTime}</Label>
                    <Input
                      id="add-due-time"
                      type="time"
                      value={addDueTime}
                      onChange={(e) => setAddDueTime(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{dict.tasks.timeHint}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-medium">{dict.tasks.reminderSection}</p>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input accent-violet-600"
                    checked={addReminder}
                    disabled={!addDueDate.trim()}
                    onChange={(e) => setAddReminder(e.target.checked)}
                  />
                  {dict.tasks.reminderEnable}
                </label>
                {offsetSelect(addOffset, setAddOffset, !addDueDate.trim() || !addReminder, "add-reminder-offset")}
              </div>
              <SubmitButton className="h-11 w-full text-base" disabled={saving}>
                {saving ? dict.transactions.saving : dict.transactions.save}
              </SubmitButton>
              {submitError ? <div className="text-sm text-destructive">{submitError}</div> : null}
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={editTask != null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTask(null)
            setSubmitError(null)
          }
        }}
      >
        <SheetContent side="center" className="gap-0 p-0 sm:w-full" showCloseButton>
          <SheetHeader className="border-b px-6 py-4 text-start">
            <SheetTitle>{dict.tasks.editTask}</SheetTitle>
          </SheetHeader>
          <div className="max-h-[min(85dvh,640px)] overflow-y-auto px-6 py-4">
            <form className="space-y-4" onSubmit={onEditSubmit}>
              <div className="space-y-2">
                <Label htmlFor="edit-title">{dict.tasks.taskTitle}</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">{dict.tasks.notes}</Label>
                <Textarea
                  id="edit-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="min-h-[5rem] resize-y"
                />
              </div>
              <div className="border-t border-border pt-4">
                <p className="mb-3 text-sm font-medium">{dict.tasks.dueSection}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{dict.tasks.dueDate}</Label>
                    <DatePickerField
                      value={editDueDate}
                      onValueChange={setEditDueDate}
                      name="edit-due"
                      minDate={toISODateLocal(now)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-due-time">{dict.tasks.dueTime}</Label>
                    <Input
                      id="edit-due-time"
                      type="time"
                      value={editDueTime}
                      onChange={(e) => setEditDueTime(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{dict.tasks.timeHint}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-medium">{dict.tasks.reminderSection}</p>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input accent-violet-600"
                    checked={editReminder}
                    disabled={!editDueDate.trim()}
                    onChange={(e) => setEditReminder(e.target.checked)}
                  />
                  {dict.tasks.reminderEnable}
                </label>
                {offsetSelect(editOffset, setEditOffset, !editDueDate.trim() || !editReminder, "edit-reminder-offset")}
              </div>
              <SubmitButton className="h-11 w-full text-base" disabled={saving}>
                {saving ? dict.transactions.saving : dict.tasks.saveChanges}
              </SubmitButton>
              {submitError && editTask ? (
                <div className="text-sm text-destructive">{submitError}</div>
              ) : null}
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{dict.tasks.list}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">{dict.tasks.loading}</div>
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : tasks.length === 0 ? (
            <div className="space-y-1">
              <div className="font-medium">{dict.tasks.emptyTitle}</div>
              <div className="text-sm text-muted-foreground">{dict.tasks.emptyBody}</div>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border" role="list">
              {tasks.map((t) => {
                const busy = togglingId === t.id || deletingId === t.id
                const urgency = dueUrgency(t, now)
                return (
                  <li
                    key={t.id}
                    className={cn(
                      "flex items-start gap-3 px-3 py-3",
                      t.done && "bg-muted/20",
                      urgency === "overdue" && !t.done && "bg-rose-50/50 dark:bg-rose-950/20"
                    )}
                  >
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        id={`task-done-${t.id}`}
                        checked={t.done}
                        disabled={busy}
                        onChange={() => void onToggleDone(t.id, !t.done)}
                        className="size-4 rounded border-input accent-violet-600"
                        aria-label={t.done ? dict.tasks.markUndone : dict.tasks.markDone}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          htmlFor={`task-done-${t.id}`}
                          className={cn(
                            "cursor-pointer text-sm font-medium",
                            t.done && "text-muted-foreground line-through"
                          )}
                        >
                          {t.title}
                        </label>
                        {urgency === "overdue" ? (
                          <Badge variant="destructive" className="text-[10px]">
                            {dict.tasks.dueOverdue}
                          </Badge>
                        ) : urgency === "today" ? (
                          <Badge className="bg-amber-500/90 text-[10px] text-white hover:bg-amber-500">
                            {dict.tasks.dueToday}
                          </Badge>
                        ) : null}
                      </div>
                      {t.notes ? (
                        <p className="mt-1 text-sm text-muted-foreground">{t.notes}</p>
                      ) : null}
                      {t.dueDate ? (
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Bell className="size-3.5 shrink-0 opacity-70" aria-hidden />
                            {formatISODateForDisplay(t.dueDate, locale)}
                            {t.dueTime ? ` · ${t.dueTime}` : null}
                          </span>
                          {t.reminderEnabled ? (
                            <span className="text-violet-600 dark:text-violet-400">
                              · {dict.tasks.reminderBadge}
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground"
                        disabled={busy}
                        onClick={() => {
                          setSubmitError(null)
                          setEditTask(t)
                        }}
                        aria-label={dict.tasks.editTask}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground hover:text-destructive"
                        disabled={busy}
                        onClick={() => void onDelete(t.id)}
                        aria-label={dict.projects.delete}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {submitError && !addOpen && !editTask ? (
        <div className="text-sm text-destructive">{submitError}</div>
      ) : null}
    </div>
  )
}

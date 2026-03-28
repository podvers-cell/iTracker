"use client"

import * as React from "react"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardSignature,
  Pencil,
  Plus,
  Trash2,
  Wallet2,
} from "lucide-react"

import { useI18n } from "@/components/i18n/I18nProvider"
import { useAuth } from "@/components/auth/AuthProvider"
import { usePersonalFinance } from "@/components/personalFinance/usePersonalFinance"
import {
  addPersonalFinanceItem,
  deletePersonalFinanceItem,
  updatePersonalFinanceItem,
  type PersonalFinanceItem,
  type PersonalFinanceKind,
} from "@/lib/data/personalFinance"
import { formatISODateForDisplay, toISODateLocal } from "@/lib/dates/localDate"
import { parseLocalizedAmount } from "@/lib/format/numericInput"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SubmitButton } from "@/components/ui/submit-button"
import { Button } from "@/components/ui/button"
import { DatePickerField } from "@/components/ui/date-picker-field"
import { Money } from "@/components/ui/money"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

function kindIcon(k: PersonalFinanceKind) {
  if (k === "income") return <ArrowUpCircle className="size-5 text-emerald-600" aria-hidden />
  if (k === "expense") return <ArrowDownCircle className="size-5 text-rose-600" aria-hidden />
  return <ClipboardSignature className="size-5 text-violet-600" aria-hidden />
}

function sumByKind(items: PersonalFinanceItem[], k: PersonalFinanceKind) {
  return items.filter((x) => x.kind === k).reduce((s, x) => s + x.amount, 0)
}

export default function PersonalFinancePage() {
  const { dict, locale } = useI18n()
  const { user } = useAuth()
  const { items, loading, error, refresh } = usePersonalFinance()

  const [addKind, setAddKind] = React.useState<PersonalFinanceKind | null>(null)
  const [editItem, setEditItem] = React.useState<PersonalFinanceItem | null>(null)
  const [addDate, setAddDate] = React.useState(() => toISODateLocal(new Date()))
  const [editDate, setEditDate] = React.useState("")
  const [editTitle, setEditTitle] = React.useState("")
  const [editAmount, setEditAmount] = React.useState("")
  const [editNotes, setEditNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!editItem) return
    setEditTitle(editItem.title)
    setEditAmount(String(editItem.amount))
    setEditDate(editItem.date)
    setEditNotes(editItem.notes ?? "")
  }, [editItem])

  React.useEffect(() => {
    if (!addKind) {
      setAddDate(toISODateLocal(new Date()))
    }
  }, [addKind])

  async function onAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    if (!user || !addKind || saving) return
    setSaving(true)
    setSubmitError(null)
    try {
      const fd = new FormData(form)
      const title = String(fd.get("title") || "").trim()
      const amountStr = String(fd.get("amount") || "").trim()
      const notes = String(fd.get("notes") || "").trim()
      const amount = parseLocalizedAmount(amountStr)
      if (!title) throw new Error(dict.personalFinance.titleRequired)
      if (!amountStr || !Number.isFinite(amount) || amount <= 0) {
        throw new Error(dict.personalFinance.amountRequired)
      }
      if (!addDate.trim()) throw new Error(dict.personalFinance.dateRequired)

      await addPersonalFinanceItem(user.uid, {
        kind: addKind,
        title,
        amount,
        date: addDate,
        notes: notes || null,
      })

      form.reset()
      setAddKind(null)
      await refresh()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : dict.personalFinance.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  async function onEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user || !editItem || saving) return
    setSaving(true)
    setSubmitError(null)
    try {
      const title = editTitle.trim()
      const amount = parseLocalizedAmount(editAmount.trim())
      if (!title) throw new Error(dict.personalFinance.titleRequired)
      if (!editAmount.trim() || !Number.isFinite(amount) || amount <= 0) {
        throw new Error(dict.personalFinance.amountRequired)
      }
      if (!editDate.trim()) throw new Error(dict.personalFinance.dateRequired)

      await updatePersonalFinanceItem(editItem.id, {
        title,
        amount,
        date: editDate,
        notes: editNotes.trim() || null,
      })

      setEditItem(null)
      await refresh()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : dict.personalFinance.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm(dict.personalFinance.confirmDelete)) return
    if (deletingId) return
    setDeletingId(id)
    try {
      await deletePersonalFinanceItem(id)
      await refresh()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : dict.personalFinance.deleteFailed)
    } finally {
      setDeletingId(null)
    }
  }

  function section(kind: PersonalFinanceKind, title: string, subtitle: string) {
    const rows = items.filter((x) => x.kind === kind)
    const total = sumByKind(items, kind)
    return (
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              {kindIcon(kind)}
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <Button type="button" size="sm" className="shrink-0 gap-1.5" onClick={() => setAddKind(kind)}>
              <Plus className="size-4" />
              {dict.personalFinance.add}
            </Button>
          </div>
          <div className="mt-3 text-lg font-semibold tabular-nums">
            <Money amount={total} locale={locale} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">{dict.personalFinance.loading}</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{dict.personalFinance.emptySection}</p>
          ) : (
            <ul className="divide-y">
              {rows.map((row) => (
                <li key={row.id} className="flex items-start gap-2 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{row.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {formatISODateForDisplay(row.date, locale)}
                    </div>
                    {row.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{row.notes}</p>
                    ) : null}
                  </div>
                  <div
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      kind === "income" && "text-emerald-700 dark:text-emerald-500",
                      kind === "expense" && "text-rose-700 dark:text-rose-400",
                      kind === "commitment" && "text-violet-700 dark:text-violet-400"
                    )}
                  >
                    <Money amount={row.amount} locale={locale} />
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      disabled={deletingId === row.id}
                      onClick={() => {
                        setSubmitError(null)
                        setEditItem(row)
                      }}
                      aria-label={dict.personalFinance.edit}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 text-muted-foreground hover:text-destructive"
                      disabled={deletingId === row.id}
                      onClick={() => void onDelete(row.id)}
                      aria-label={dict.personalFinance.delete}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    )
  }

  const incomeTotal = sumByKind(items, "income")
  const expenseTotal = sumByKind(items, "expense")
  const commitmentTotal = sumByKind(items, "commitment")
  const netPersonal = incomeTotal - expenseTotal - commitmentTotal

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Wallet2 className="size-7 shrink-0 text-violet-600" aria-hidden />
          {dict.personalFinance.title}
        </h1>
        <p className="text-sm text-muted-foreground">{dict.personalFinance.subtitle}</p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Card className="border-violet-200/60 bg-violet-50/40 dark:border-violet-900/40 dark:bg-violet-950/20">
        <CardContent className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-muted-foreground">{dict.personalFinance.summaryNet}</span>
          <span
            className={cn(
              "text-xl font-bold tabular-nums",
              netPersonal >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
            )}
          >
            <Money amount={netPersonal} locale={locale} />
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {section("income", dict.personalFinance.incomeTitle, dict.personalFinance.incomeHint)}
        {section("expense", dict.personalFinance.expenseTitle, dict.personalFinance.expenseHint)}
        {section("commitment", dict.personalFinance.commitmentTitle, dict.personalFinance.commitmentHint)}
      </div>

      <Sheet
        open={addKind != null}
        onOpenChange={(open) => {
          if (!open) {
            setAddKind(null)
            setSubmitError(null)
          }
        }}
      >
        <SheetContent side="center" className="gap-0 p-0 sm:w-full" showCloseButton>
          <SheetHeader className="border-b px-6 py-4 text-start">
            <SheetTitle>
              {addKind === "income"
                ? dict.personalFinance.addIncome
                : addKind === "expense"
                  ? dict.personalFinance.addExpense
                  : dict.personalFinance.addCommitment}
            </SheetTitle>
            <SheetDescription className="text-start">{dict.personalFinance.addSheetHint}</SheetDescription>
          </SheetHeader>
          <div className="px-6 py-4">
            <form className="space-y-4" onSubmit={onAddSubmit}>
              <div className="space-y-2">
                <Label htmlFor="pf-title">{dict.personalFinance.fieldTitle}</Label>
                <Input id="pf-title" name="title" required placeholder={dict.personalFinance.fieldTitle} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-amount">{dict.transactions.amount}</Label>
                <Input id="pf-amount" name="amount" inputMode="decimal" required placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>{dict.transactions.date}</Label>
                <DatePickerField name="date" value={addDate} onValueChange={setAddDate} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-notes">{dict.personalFinance.fieldNotes}</Label>
                <Textarea id="pf-notes" name="notes" rows={2} placeholder={dict.personalFinance.notesOptional} />
              </div>
              <SubmitButton className="h-11 w-full" disabled={saving}>
                {saving ? dict.transactions.saving : dict.transactions.save}
              </SubmitButton>
              {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={editItem != null}
        onOpenChange={(open) => {
          if (!open) {
            setEditItem(null)
            setSubmitError(null)
          }
        }}
      >
        <SheetContent side="center" className="gap-0 p-0 sm:w-full" showCloseButton>
          <SheetHeader className="border-b px-6 py-4 text-start">
            <SheetTitle>{dict.personalFinance.edit}</SheetTitle>
          </SheetHeader>
          <div className="px-6 py-4">
            <form className="space-y-4" onSubmit={onEditSubmit}>
              <div className="space-y-2">
                <Label htmlFor="pf-edit-title">{dict.personalFinance.fieldTitle}</Label>
                <Input
                  id="pf-edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-edit-amount">{dict.transactions.amount}</Label>
                <Input
                  id="pf-edit-amount"
                  inputMode="decimal"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{dict.transactions.date}</Label>
                <DatePickerField value={editDate} onValueChange={setEditDate} name="edit-pf-date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-edit-notes">{dict.personalFinance.fieldNotes}</Label>
                <Textarea
                  id="pf-edit-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <SubmitButton className="h-11 w-full" disabled={saving}>
                {saving ? dict.transactions.saving : dict.personalFinance.saveChanges}
              </SubmitButton>
              {submitError && editItem ? (
                <p className="text-sm text-destructive">{submitError}</p>
              ) : null}
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {submitError && addKind == null && editItem == null ? (
        <p className="text-sm text-destructive">{submitError}</p>
      ) : null}
    </div>
  )
}

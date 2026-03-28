"use client"

import * as React from "react"
import { Phone, Plus, Users } from "lucide-react"

import { useI18n } from "@/components/i18n/I18nProvider"
import { useAuth } from "@/components/auth/AuthProvider"
import { useCustomers } from "@/components/customers/useCustomers"
import { addCustomer, deleteCustomerById } from "@/lib/data/customers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/ui/submit-button"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export default function CustomersPage() {
  const { dict } = useI18n()
  const { user } = useAuth()
  const { customers, loading, error, refresh } = useCustomers()

  const [addOpen, setAddOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    if (!user) {
      setSubmitError("Not authenticated")
      return
    }
    if (saving) return

    setSaving(true)
    setSubmitError(null)
    try {
      const fd = new FormData(form)
      const name = String(fd.get("name") || "").trim()
      const phone = String(fd.get("phone") || "").trim()
      const notes = String(fd.get("notes") || "").trim()

      if (!name) throw new Error("Name is required")

      await addCustomer(user.uid, {
        name,
        phone: phone || null,
        notes: notes || null,
      })

      form.reset()
      await refresh()
      setAddOpen(false)
    } catch (err: any) {
      setSubmitError(err?.message ?? "Failed to add customer")
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(customerId: string) {
    const ok = window.confirm(dict.customers.confirmDelete)
    if (!ok || deletingId) return
    setDeletingId(customerId)
    try {
      await deleteCustomerById(customerId)
      await refresh()
    } catch (err: any) {
      setSubmitError(err?.message ?? "Failed to delete customer")
    } finally {
      setDeletingId(null)
    }
  }

  function normalizePhoneForCall(phone: string) {
    const cleaned = phone.replace(/[^\d+]/g, "")
    if (!cleaned) return null
    return cleaned
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Users className="size-7 shrink-0 text-violet-600" aria-hidden />
            {dict.customers.title}
          </h1>
          <p className="text-sm text-muted-foreground">{dict.customers.subtitle}</p>
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
          {dict.customers.addNew}
        </Button>
      </div>

      <Sheet
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (!open) setSubmitError(null)
        }}
      >
        <SheetContent side="center" className="gap-0 p-0 sm:w-full" showCloseButton>
          <SheetHeader className="border-b px-6 py-4 text-start">
            <SheetTitle>{dict.customers.add}</SheetTitle>
            <SheetDescription className="text-start">{dict.customers.subtitle}</SheetDescription>
          </SheetHeader>
          <div className="px-6 py-4">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">{dict.customers.name}</Label>
                  <Input
                    id="customer-name"
                    name="name"
                    placeholder={dict.customers.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">{dict.customers.phone}</Label>
                  <Input
                    id="customer-phone"
                    name="phone"
                    inputMode="tel"
                    placeholder={dict.customers.phone}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-notes">{dict.customers.notes}</Label>
                <Input id="customer-notes" name="notes" placeholder={dict.customers.notes} />
              </div>
              <SubmitButton className="h-11 w-full text-base" disabled={saving}>
                {saving ? dict.transactions.saving : dict.transactions.save}
              </SubmitButton>
              {submitError ? (
                <div className="text-sm text-destructive">{submitError}</div>
              ) : null}
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{dict.customers.list}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : customers.length === 0 ? (
            <div className="space-y-1">
              <div className="font-medium">{dict.customers.emptyTitle}</div>
              <div className="text-sm text-muted-foreground">{dict.customers.emptyBody}</div>
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {customers.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{c.name}</div>
                    {c.phone ? <div className="mt-1 text-sm text-muted-foreground">{c.phone}</div> : null}
                    {c.notes ? <div className="mt-1 text-xs text-muted-foreground">{c.notes}</div> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.phone && normalizePhoneForCall(c.phone) ? (
                      <a
                        href={`tel:${normalizePhoneForCall(c.phone)}`}
                        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "gap-1.5")}
                        title={dict.customers.call}
                      >
                        <Phone className="size-3.5" />
                        {dict.customers.call}
                      </a>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={deletingId === c.id}
                      onClick={() => void onDelete(c.id)}
                    >
                      {deletingId === c.id ? dict.projects.deleting : dict.projects.delete}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {submitError && !addOpen ? (
        <div className="text-sm text-destructive">{submitError}</div>
      ) : null}
    </div>
  )
}

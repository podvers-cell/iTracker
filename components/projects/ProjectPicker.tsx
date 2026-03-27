"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import type { Project } from "@/lib/data/projects"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/components/i18n/I18nProvider"
import { cn } from "@/lib/utils"

export function ProjectPicker({
  projects,
  value,
  onChange,
  label,
}: {
  projects: Project[]
  value: string
  onChange: (projectId: string) => void
  label: string
}) {
  const { locale } = useI18n()
  const rtl = locale === "ar"
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  const selected = projects.find((p) => p.id === value)

  React.useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("mousedown", onPointerDown)
    window.addEventListener("keydown", onEsc)
    return () => {
      window.removeEventListener("mousedown", onPointerDown)
      window.removeEventListener("keydown", onEsc)
    }
  }, [])

  return (
    <div className="space-y-2" ref={rootRef}>
      <Label htmlFor="projectPicker">{label}</Label>
      <button
        id="projectPicker"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-14 w-full items-center justify-between rounded-3xl border border-input bg-background/95 px-4 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-primary/25",
          rtl ? "text-right" : "text-left",
          open ? "ring-2 ring-primary/25" : ""
        )}
      >
        <span className="truncate">{selected?.name ?? "—"}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open ? "rotate-180" : "")} />
      </button>

      {open ? (
        <div
          role="listbox"
          className="relative z-30 mt-2 max-h-64 overflow-auto rounded-2xl border border-border bg-popover p-1 shadow-lg"
        >
          {projects.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">—</div>
          ) : (
            projects.map((p) => {
              const active = p.id === value
              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(p.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center rounded-xl px-3 py-2 text-sm transition-colors",
                    rtl ? "justify-end text-right" : "justify-start text-left",
                    active ? "bg-muted font-medium text-foreground" : "hover:bg-muted/70"
                  )}
                >
                  {p.name}
                </button>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}


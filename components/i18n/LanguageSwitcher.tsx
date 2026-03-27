"use client"

import { Check, Globe } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n } from "@/components/i18n/I18nProvider"
import type { Locale } from "@/lib/i18n/locales"
import { cn } from "@/lib/utils"

export type LanguageSwitcherProps = {
  /** Icon-only control: no label on the trigger; richer hover / focus feedback. */
  iconOnly?: boolean
}

export function LanguageSwitcher({ iconOnly = false }: LanguageSwitcherProps) {
  const { dict, locale, setLocale } = useI18n()

  const onSelect = (next: Locale) => setLocale(next)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={dict.common.language}
        aria-haspopup="menu"
        className={cn(
          iconOnly
            ? cn(
                "group relative grid size-12 shrink-0 cursor-default place-items-center rounded-2xl",
                "bg-background/75 shadow-sm backdrop-blur-xl",
                "transition-all duration-300 ease-out",
                "hover:-translate-y-0.5 hover:bg-background/95 hover:shadow-md",
                "active:translate-y-0 active:scale-[0.96]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )
            : cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "cursor-default gap-2"
              )
        )}
      >
        {iconOnly ? (
          <>
            <span
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -inset-px rounded-2xl bg-primary/20 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-70"
              aria-hidden
            />
            <Globe
              className="relative size-[1.35rem] text-primary transition-transform duration-300 ease-out group-hover:rotate-[15deg] group-active:rotate-0 group-active:scale-95"
              strokeWidth={2.25}
              aria-hidden
            />
          </>
        ) : (
          <>
            <Globe className="size-4" aria-hidden />
            {dict.common.language}
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={iconOnly ? "start" : "end"}
        sideOffset={iconOnly ? 10 : 4}
        className={cn(
          iconOnly
            ? "!w-max min-w-[13rem] max-w-[min(18rem,calc(100vw-1.5rem))] !overflow-x-visible !overflow-y-visible p-1.5 shadow-xl"
            : "min-w-[10rem]"
        )}
      >
        <DropdownMenuItem
          onClick={() => onSelect("ar")}
          className={cn(
            "flex cursor-pointer items-center justify-between gap-3 whitespace-nowrap py-2.5",
            locale === "ar" && "bg-accent/60"
          )}
        >
          <span className={locale === "ar" ? "font-semibold" : undefined}>{dict.common.arabic}</span>
          {locale === "ar" ? <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSelect("en")}
          className={cn(
            "flex cursor-pointer items-center justify-between gap-3 whitespace-nowrap py-2.5",
            locale === "en" && "bg-accent/60"
          )}
        >
          <span className={locale === "en" ? "font-semibold" : undefined}>{dict.common.english}</span>
          {locale === "en" ? <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} /> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


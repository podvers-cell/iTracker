"use client"

import { Globe } from "lucide-react"

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

export function LanguageSwitcher() {
  const { dict, locale, setLocale } = useI18n()

  const onSelect = (next: Locale) => setLocale(next)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "cursor-default"
        )}
      >
        <Globe />
        {dict.common.language}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onSelect("ar")}
          className={locale === "ar" ? "font-semibold" : undefined}
        >
          {dict.common.arabic}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSelect("en")}
          className={locale === "en" ? "font-semibold" : undefined}
        >
          {dict.common.english}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


"use client"

import { useI18n } from "@/components/i18n/I18nProvider"
import { cn } from "@/lib/utils"

const DEVELOPER_INSTAGRAM = "https://www.instagram.com/melgml10/"

type PageDeveloperCreditProps = {
  /** Auth pages (purple glass): lighter text on translucent border */
  variant?: "default" | "auth"
  className?: string
}

export function PageDeveloperCredit({ variant = "default", className }: PageDeveloperCreditProps) {
  const { dict } = useI18n()

  return (
    <p
      className={cn(
        "mt-6 text-center text-[0.65rem] leading-snug sm:mt-8 sm:text-xs",
        variant === "auth"
          ? "border-t border-white/20 pt-4 text-white/55"
          : "border-t border-border/40 pt-4 text-muted-foreground",
        className
      )}
    >
      <span>{dict.footer.creditPrefix}</span>
      <a
        href={DEVELOPER_INSTAGRAM}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "font-bold underline-offset-2 hover:underline",
          variant === "auth"
            ? "text-white/95 hover:text-white"
            : "text-foreground hover:text-foreground/90"
        )}
      >
        {dict.footer.creditName}
      </a>
    </p>
  )
}

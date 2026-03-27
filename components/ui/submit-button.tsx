"use client"

import { Button } from "@/components/ui/button"

export function SubmitButton({
  children,
  className,
  disabled,
}: {
  children: React.ReactNode
  className?: string
  disabled?: boolean
}) {
  return (
    <Button type="submit" className={className} disabled={disabled}>
      {children}
    </Button>
  )
}


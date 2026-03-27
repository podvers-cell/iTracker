import { cn } from "@/lib/utils"

/** Vector wordmark; source matches `app/icon.svg` and `public/logo.svg`. */
export function AppLogo({
  alt,
  className,
}: {
  alt: string
  className?: string
}) {
  return (
    <img
      src="/logo.svg"
      alt={alt}
      width={512}
      height={512}
      decoding="async"
      className={cn("object-contain", className)}
    />
  )
}

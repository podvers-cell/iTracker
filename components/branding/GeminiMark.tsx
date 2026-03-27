import { cn } from "@/lib/utils"

/** Official-style Gemini mark (PNG from Google branding asset). */
export function GeminiMark({ className }: { className?: string }) {
  return (
    <img
      src="/gemini-mark.png"
      alt=""
      width={256}
      height={256}
      decoding="async"
      className={cn("object-contain", className)}
    />
  )
}

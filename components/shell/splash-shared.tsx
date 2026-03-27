"use client"

import { AppLogo } from "@/components/branding/AppLogo"
import { cn } from "@/lib/utils"

/** Same layered background as the root splash screen (purple chrome + wave). */
export function SplashStyleBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-b from-violet-600 via-purple-700 to-indigo-950" />
      <div
        className="absolute inset-0 opacity-85"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% -20%, rgba(255,255,255,0.22), transparent 50%), radial-gradient(ellipse 70% 55% at 100% 100%, rgba(91,33,182,0.45), transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(6,182,212,0.12), transparent 50%)",
        }}
      />
      <div className="splash-orb-1 absolute -left-[15%] top-[8%] h-[min(90vw,440px)] w-[min(90vw,440px)] rounded-full bg-white/20 blur-[72px]" />
      <div className="splash-orb-2 absolute -right-[12%] bottom-[10%] h-[min(80vw,380px)] w-[min(80vw,380px)] rounded-full bg-indigo-400/30 blur-[64px]" />
      <div className="splash-orb-3 absolute left-[15%] bottom-[20%] h-[min(60vw,300px)] w-[min(60vw,300px)] rounded-full bg-cyan-300/20 blur-[56px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.35)_100%)]" />
      <svg
        className="absolute inset-x-0 bottom-0 h-[min(18vh,120px)] w-full text-white/[0.08]"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,60 C200,20 400,100 600,55 C800,10 1000,90 1200,45 L1200,120 L0,120 Z"
        />
      </svg>
    </div>
  )
}

/** Logo + orbiting rings (splash / auth hero). */
export function SplashStyleLogoHero({
  alt,
  className,
  logoClassName,
}: {
  alt: string
  className?: string
  logoClassName?: string
}) {
  return (
    <div
      className={cn(
        "relative grid h-[8.5rem] w-[8.5rem] place-items-center sm:h-40 sm:w-40",
        className
      )}
    >
      <div className="splash-ring-spin pointer-events-none absolute -inset-0.5 rounded-full border-[1.5px] border-dashed border-white/35" />
      <div className="splash-ring-spin-rev pointer-events-none absolute -inset-3 rounded-full border border-white/20" />
      <AppLogo
        alt={alt}
        className={cn(
          "relative z-[1] size-[7.25rem] object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)] sm:size-32",
          logoClassName
        )}
      />
    </div>
  )
}

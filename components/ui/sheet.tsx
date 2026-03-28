"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  swipeFromLeft = false,
  leftInset = false,
  style,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left" | "center"
  showCloseButton?: boolean
  /**
   * Left sheet only: full swipe from off-screen left → in (physical left edge).
   * Transform-only animation, no opacity fade on panel or backdrop.
   */
  swipeFromLeft?: boolean
  /**
   * Left sheet only: panel is inset from top/bottom instead of full-viewport `inset-y-0` —
   * use for settings drawer so it does not stick to the top edge (flush to the start side).
   */
  leftInset?: boolean
}) {
  const leftSwipeMotion =
    side === "left" &&
    swipeFromLeft &&
    ([
      "will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
      /* outside (fully left) → inside; no rtl mirror — always from viewport left */
      "data-[side=left]:data-starting-style:-translate-x-full",
      "data-[side=left]:data-ending-style:-translate-x-full",
    ] as const)

  const leftSlideMotion =
    side === "left" &&
    !swipeFromLeft &&
    ([
      "data-[side=left]:data-ending-style:translate-x-[-2.5rem] rtl:data-[side=left]:data-ending-style:-translate-x-[-2.5rem]",
      "data-[side=left]:data-starting-style:translate-x-[-2.5rem] rtl:data-[side=left]:data-starting-style:-translate-x-[-2.5rem]",
    ] as const)

  const popupOpacityTransition =
    side === "left" && swipeFromLeft
      ? ""
      : "transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0"

  const leftSheetPosition =
    side !== "left"
      ? ""
      : leftInset
        ? [
            "data-[side=left]:top-[max(2.25rem,calc(env(safe-area-inset-top)+1rem))]",
            "data-[side=left]:bottom-[max(1rem,env(safe-area-inset-bottom))]",
            "data-[side=left]:left-0",
            "data-[side=left]:h-auto data-[side=left]:max-h-none",
            "data-[side=left]:w-[min(20rem,calc(100vw-1rem))]",
            "data-[side=left]:overflow-hidden",
            "data-[side=left]:border data-[side=left]:border-border/60",
            "data-[side=left]:shadow-2xl",
          ].join(" ")
        : "data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-e"

  /** Inline radii: tailwind-merge keeps only one `rounded-*` class, so corner-specific classes were dropped. */
  const leftInsetRadiusStyle: React.CSSProperties | undefined =
    side === "left" && leftInset
      ? {
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          borderTopRightRadius: "var(--radius-2xl)",
          borderBottomRightRadius: "var(--radius-2xl)",
        }
      : undefined

  return (
    <SheetPortal>
      <SheetOverlay
        className={
          side === "left" && swipeFromLeft
            ? "transition-none opacity-100 data-starting-style:opacity-100 data-ending-style:opacity-100"
            : undefined
        }
      />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-s data-[side=right]:data-ending-style:translate-x-[2.5rem] rtl:data-[side=right]:data-ending-style:-translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] rtl:data-[side=right]:data-starting-style:-translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm data-[side=center]:left-1/2 data-[side=center]:top-1/2 data-[side=center]:w-[calc(100%-1.5rem)] data-[side=center]:max-w-lg data-[side=center]:max-h-[min(92dvh,720px)] data-[side=center]:-translate-x-1/2 data-[side=center]:-translate-y-1/2 data-[side=center]:overflow-y-auto data-[side=center]:rounded-2xl data-[side=center]:border data-[side=center]:shadow-xl data-[side=center]:data-ending-style:scale-[0.97] data-[side=center]:data-starting-style:scale-[0.97]",
          leftSheetPosition,
          popupOpacityTransition,
          leftSlideMotion,
          leftSwipeMotion,
          className
        )}
        style={{ ...style, ...leftInsetRadiusStyle }}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 end-3"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

"use client"

import * as React from "react"

import type { GeneralTask } from "@/lib/data/generalTasks"
import { markTaskReminderNotified } from "@/lib/data/generalTasks"

type ReminderDict = {
  reminderNotificationTitle: string
}

export function useTaskReminderNotifications(
  tasks: GeneralTask[],
  refresh: () => void | Promise<void>,
  dict: ReminderDict
) {
  const refreshRef = React.useRef(refresh)
  refreshRef.current = refresh

  React.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return

    const sessionFired = new Set<string>()

    const tick = async () => {
      if (Notification.permission !== "granted") return
      const now = Date.now()
      for (const t of tasks) {
        if (t.done || !t.reminderEnabled || !t.reminderAt) continue
        const at = t.reminderAt.getTime()
        if (at > now) continue
        const notifiedOk =
          t.reminderNotifiedAt != null && t.reminderNotifiedAt.getTime() >= at - 500
        if (notifiedOk) continue
        const key = `${t.id}-${at}`
        if (sessionFired.has(key)) continue
        sessionFired.add(key)
        try {
          new Notification(dict.reminderNotificationTitle, {
            body: t.title,
            tag: key,
            icon: "/icons/icon-192.png",
          })
          await markTaskReminderNotified(t.id)
          await refreshRef.current()
        } catch {
          sessionFired.delete(key)
        }
      }
    }

    const id = window.setInterval(() => void tick(), 30_000)
    void tick()
    return () => window.clearInterval(id)
  }, [tasks, dict.reminderNotificationTitle])
}

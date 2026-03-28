import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore"

import { compareISODates, normalizeCalendarDateString, toISODateLocal } from "@/lib/dates/localDate"
import { DateValidationCode } from "@/lib/validation/dateCodes"
import { clientDb } from "@/lib/firebase/client"
import { firestoreReadWithRetry } from "@/lib/firebase/firestore-read"

export type GeneralTask = {
  id: string
  title: string
  notes: string | null
  done: boolean
  dueDate: string | null
  dueTime: string | null
  reminderEnabled: boolean
  reminderOffsetMinutes: number
  reminderAt: Date | null
  reminderNotifiedAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
}

type GeneralTaskDoc = {
  ownerUid?: string
  title: string
  notes?: string | null
  done?: boolean
  dueDate?: string | null
  dueTime?: string | null
  reminderEnabled?: boolean
  reminderOffsetMinutes?: number
  reminderAt?: Timestamp | null
  reminderNotifiedAt?: Timestamp | null
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type CreateGeneralTaskInput = {
  title: string
  notes?: string | null
  dueDate?: string | null
  dueTime?: string | null
  reminderEnabled?: boolean
  reminderOffsetMinutes?: number
}

export type UpdateGeneralTaskPatch = {
  title?: string
  notes?: string | null
  done?: boolean
  dueDate?: string | null
  dueTime?: string | null
  reminderEnabled?: boolean
  reminderOffsetMinutes?: number
}

const DEFAULT_REMINDER_OFFSET = 15

export const TASK_REMINDER_OFFSET_MINUTES = [0, 5, 15, 30, 60, 120, 1440] as const

/** Local due moment (ms). Empty time → 09:00 on dueDate. */
export function dueMomentMs(dueDate: string | null, dueTime: string | null): number | null {
  if (!dueDate?.trim()) return null
  const core = normalizeCalendarDateString(dueDate.trim())
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(core)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  let hh = 9
  let mm = 0
  const t = dueTime?.trim()
  if (t) {
    const tm = /^(\d{1,2}):(\d{2})$/.exec(t)
    if (tm) {
      hh = Number(tm[1])
      mm = Number(tm[2])
    }
  }
  const local = new Date(y, mo - 1, d, hh, mm, 0, 0)
  if (!Number.isFinite(local.getTime())) return null
  return local.getTime()
}

export function computeReminderAtTimestamp(
  dueDate: string | null,
  dueTime: string | null,
  reminderEnabled: boolean,
  reminderOffsetMinutes: number
): Timestamp | null {
  if (!reminderEnabled) return null
  const dueMs = dueMomentMs(dueDate, dueTime)
  if (dueMs == null) return null
  const at = dueMs - (reminderOffsetMinutes || 0) * 60_000
  return Timestamp.fromMillis(at)
}

const PAST_DATETIME_SLACK_MS = 90_000

/** Reject due dates in the past and “today” times that have already passed (local clock). */
export function assertDueScheduleNotInPast(dueDate: string | null, dueTime: string | null): void {
  if (!dueDate?.trim()) return
  const day = normalizeCalendarDateString(dueDate.trim())
  const today = toISODateLocal(new Date())
  if (compareISODates(day, today) < 0) {
    throw new Error(DateValidationCode.PAST_CALENDAR_DATE)
  }
  const ms = dueMomentMs(dueDate, dueTime)
  if (ms == null) return
  if (ms < Date.now() - PAST_DATETIME_SLACK_MS) {
    throw new Error(DateValidationCode.PAST_DATETIME)
  }
}

function requireDb() {
  const db = clientDb()
  if (!db) throw new Error("Firebase is not configured. Check NEXT_PUBLIC_FIREBASE_* env vars.")
  return db
}

function requireOwnerUid(ownerUid: string | undefined) {
  const uid = ownerUid?.trim()
  if (!uid) throw new Error("Not signed in")
  return uid
}

function tsToDate(ts?: Timestamp | null) {
  return ts ? ts.toDate() : null
}

function normalizeGeneralTask(id: string, data: GeneralTaskDoc): GeneralTask {
  const offset =
    typeof data.reminderOffsetMinutes === "number" && Number.isFinite(data.reminderOffsetMinutes)
      ? data.reminderOffsetMinutes
      : DEFAULT_REMINDER_OFFSET
  return {
    id,
    title: data.title,
    notes: data.notes ?? null,
    done: data.done === true,
    dueDate: typeof data.dueDate === "string" && data.dueDate.trim() ? data.dueDate.trim() : null,
    dueTime: typeof data.dueTime === "string" && data.dueTime.trim() ? data.dueTime.trim() : null,
    reminderEnabled: data.reminderEnabled === true,
    reminderOffsetMinutes: offset,
    reminderAt: tsToDate(data.reminderAt ?? undefined),
    reminderNotifiedAt: tsToDate(data.reminderNotifiedAt ?? undefined),
    createdAt: tsToDate(data.createdAt),
    updatedAt: tsToDate(data.updatedAt),
  }
}

function dueSortKey(t: GeneralTask): number {
  const ms = dueMomentMs(t.dueDate, t.dueTime)
  return ms != null ? ms : Number.MAX_SAFE_INTEGER
}

export async function getGeneralTasks(ownerUid: string): Promise<GeneralTask[]> {
  const uid = requireOwnerUid(ownerUid)
  const db = requireDb()
  const q = query(collection(db, "generalTasks"), where("ownerUid", "==", uid))
  const snap = await firestoreReadWithRetry(() => getDocs(q), { label: "generalTasks" })
  const items = snap.docs.map((d) => normalizeGeneralTask(d.id, d.data() as GeneralTaskDoc))
  items.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    const da = dueSortKey(a)
    const db_ = dueSortKey(b)
    if (da !== db_) return da - db_
    return (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0)
  })
  return items
}

export async function addGeneralTask(ownerUid: string, input: CreateGeneralTaskInput): Promise<string> {
  const uid = requireOwnerUid(ownerUid)
  const db = requireDb()
  const title = input.title.trim()
  if (!title) throw new Error("Title is required")

  const dueDate = input.dueDate?.trim() || null
  const dueTime = input.dueTime?.trim() || null
  const reminderEnabled = Boolean(input.reminderEnabled && dueDate)
  const reminderOffsetMinutes =
    typeof input.reminderOffsetMinutes === "number" && Number.isFinite(input.reminderOffsetMinutes)
      ? input.reminderOffsetMinutes
      : DEFAULT_REMINDER_OFFSET

  assertDueScheduleNotInPast(dueDate, dueTime)

  const reminderAt = computeReminderAtTimestamp(
    dueDate,
    dueTime,
    reminderEnabled,
    reminderOffsetMinutes
  )

  const ref = await addDoc(collection(db, "generalTasks"), {
    ownerUid: uid,
    title,
    notes: input.notes?.trim() || null,
    done: false,
    dueDate,
    dueTime,
    reminderEnabled,
    reminderOffsetMinutes,
    reminderAt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateGeneralTask(taskId: string, patch: UpdateGeneralTaskPatch): Promise<void> {
  const db = requireDb()
  const ref = doc(db, "generalTasks", taskId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error("Task not found")
  const cur = snap.data() as GeneralTaskDoc

  const title =
    patch.title !== undefined ? patch.title.trim() : String(cur.title ?? "").trim()
  if (patch.title !== undefined && !title) throw new Error("Title is required")

  const notes = patch.notes !== undefined ? patch.notes?.trim() || null : (cur.notes ?? null)
  const done = patch.done !== undefined ? patch.done : cur.done === true

  let dueDate =
    patch.dueDate !== undefined
      ? patch.dueDate?.trim() || null
      : typeof cur.dueDate === "string"
        ? cur.dueDate
        : null
  let dueTime =
    patch.dueTime !== undefined
      ? patch.dueTime?.trim() || null
      : typeof cur.dueTime === "string"
        ? cur.dueTime
        : null

  let reminderEnabled =
    patch.reminderEnabled !== undefined ? patch.reminderEnabled : cur.reminderEnabled === true
  let reminderOffsetMinutes =
    patch.reminderOffsetMinutes !== undefined
      ? patch.reminderOffsetMinutes
      : typeof cur.reminderOffsetMinutes === "number"
        ? cur.reminderOffsetMinutes
        : DEFAULT_REMINDER_OFFSET

  if (!dueDate) {
    reminderEnabled = false
    dueTime = null
  }

  const scheduleTouched =
    patch.dueDate !== undefined ||
    patch.dueTime !== undefined ||
    patch.reminderEnabled !== undefined ||
    patch.reminderOffsetMinutes !== undefined

  if (dueDate) {
    assertDueScheduleNotInPast(dueDate, dueTime)
  }

  const reminderAt = computeReminderAtTimestamp(
    dueDate,
    dueTime,
    reminderEnabled,
    reminderOffsetMinutes
  )

  const payload: Record<string, unknown> = {
    title,
    notes,
    done,
    dueDate,
    dueTime,
    reminderEnabled,
    reminderOffsetMinutes,
    reminderAt,
    updatedAt: serverTimestamp(),
  }

  if (scheduleTouched) {
    payload.reminderNotifiedAt = deleteField()
  }

  await updateDoc(ref, payload)
}

export async function markTaskReminderNotified(taskId: string): Promise<void> {
  const db = requireDb()
  await updateDoc(doc(db, "generalTasks", taskId), {
    reminderNotifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteGeneralTaskById(taskId: string): Promise<void> {
  const db = requireDb()
  await deleteDoc(doc(db, "generalTasks", taskId))
}

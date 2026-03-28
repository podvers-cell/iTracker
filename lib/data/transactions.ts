import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore"

import { clientDb } from "@/lib/firebase/client"
import { firestoreReadWithRetry } from "@/lib/firebase/firestore-read"
import {
  calendarDateFromCompactNumber,
  compareISODates,
  normalizeCalendarDateString,
  toISODateLocal,
} from "@/lib/dates/localDate"
import { DateValidationCode } from "@/lib/validation/dateCodes"

export type TransactionType = "expense" | "income"

export type Transaction = {
  id: string
  projectId: string
  type: TransactionType
  amount: number
  category: string
  description: string | null
  date: string // YYYY-MM-DD
  createdAt: Date | null
}

type TransactionDoc = {
  ownerUid?: string
  projectId: string
  type?: TransactionType | string
  amount: number
  category: string
  description?: string | null
  /** YYYY-MM-DD string, ISO datetime, loose forms, or Firestore Timestamp — normalized on read */
  date?: string | Timestamp | null
  createdAt?: Timestamp
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

function tsToDate(ts?: Timestamp) {
  return ts ? ts.toDate() : null
}

function coerceNumber(n: unknown): number {
  if (typeof n === "number" && Number.isFinite(n)) return n
  if (typeof n === "string" && n.trim() !== "") {
    const v = Number(n.replace(/,/g, "").replace(/\u00a0/g, "").trim())
    return Number.isFinite(v) ? v : 0
  }
  return 0
}

function coerceTransactionDate(value: unknown, createdAt?: Timestamp): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    const fromCompact = calendarDateFromCompactNumber(value)
    if (fromCompact) return fromCompact
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return toISODateLocal(d)
  }
  if (value != null && typeof value === "object") {
    const o = value as { toDate?: () => Date; seconds?: number }
    if (typeof o.toDate === "function") {
      const d = o.toDate()
      if (d instanceof Date && !Number.isNaN(d.getTime())) return toISODateLocal(d)
    }
    if (typeof o.seconds === "number") {
      const d = new Date(o.seconds * 1000)
      if (!Number.isNaN(d.getTime())) return toISODateLocal(d)
    }
  }
  if (typeof value === "string" && value.trim() !== "") {
    return normalizeCalendarDateString(value)
  }
  const fb = tsToDate(createdAt)
  if (fb) return toISODateLocal(fb)
  return toISODateLocal(new Date())
}

function coerceTransactionType(raw: unknown): TransactionType {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
  return s === "income" ? "income" : "expense"
}

function normalizeTransaction(id: string, docData: TransactionDoc): Transaction {
  return {
    id,
    projectId: docData.projectId,
    type: coerceTransactionType(docData.type),
    amount: coerceNumber(docData.amount),
    category: docData.category,
    description: docData.description ?? null,
    date: coerceTransactionDate(docData.date, docData.createdAt),
    createdAt: tsToDate(docData.createdAt),
  }
}

export type AddTransactionInput = {
  projectId: string
  type: TransactionType
  amount: number
  category: string
  description?: string | null
  date: string
}

// Writing the first document automatically creates the "transactions" collection.
export async function addTransaction(
  ownerUid: string,
  input: AddTransactionInput
): Promise<string> {
  const uid = requireOwnerUid(ownerUid)
  const db = requireDb()

  const norm = normalizeCalendarDateString(input.date)
  const today = toISODateLocal(new Date())
  if (compareISODates(norm, today) < 0) {
    throw new Error(DateValidationCode.PAST_CALENDAR_DATE)
  }

  const ref = await addDoc(collection(db, "transactions"), {
    ownerUid: uid,
    projectId: input.projectId,
    type: input.type,
    amount: input.amount,
    category: input.category.trim(),
    description: input.description?.trim() || null,
    date: norm,
    createdAt: serverTimestamp(),
  })

  return ref.id
}

export async function getTransactionsByProject(
  ownerUid: string,
  projectId: string
): Promise<Transaction[]> {
  const uid = requireOwnerUid(ownerUid)
  const db = requireDb()

  const q = query(
    collection(db, "transactions"),
    where("ownerUid", "==", uid),
    where("projectId", "==", projectId)
  )
  const snap = await firestoreReadWithRetry(() => getDocs(q), { label: "transactions" })
  const items = snap.docs.map((d) => normalizeTransaction(d.id, d.data() as TransactionDoc))

  items.sort((a, b) => {
    if (a.date !== b.date) return a.date > b.date ? -1 : 1
    const at = a.createdAt?.getTime() ?? 0
    const bt = b.createdAt?.getTime() ?? 0
    return bt - at
  })

  return items
}

export async function getTransactions(ownerUid: string): Promise<Transaction[]> {
  const uid = requireOwnerUid(ownerUid)
  const db = requireDb()
  const q = query(collection(db, "transactions"), where("ownerUid", "==", uid))
  const snap = await firestoreReadWithRetry(() => getDocs(q), { label: "transactions" })
  const items = snap.docs.map((d) => normalizeTransaction(d.id, d.data() as TransactionDoc))

  items.sort((a, b) => {
    if (a.date !== b.date) return a.date > b.date ? -1 : 1
    const at = a.createdAt?.getTime() ?? 0
    const bt = b.createdAt?.getTime() ?? 0
    return bt - at
  })

  return items
}

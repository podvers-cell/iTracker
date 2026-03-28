import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore"

import { normalizeCalendarDateString } from "@/lib/dates/localDate"
import { clientDb } from "@/lib/firebase/client"
import { firestoreReadWithRetry } from "@/lib/firebase/firestore-read"

export type PersonalFinanceKind = "income" | "expense" | "commitment"

export type PersonalFinanceItem = {
  id: string
  kind: PersonalFinanceKind
  title: string
  amount: number
  date: string
  notes: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

type PersonalFinanceDoc = {
  ownerUid?: string
  kind?: string
  title: string
  amount: number
  date?: string | null
  notes?: string | null
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type CreatePersonalFinanceInput = {
  kind: PersonalFinanceKind
  title: string
  amount: number
  date: string
  notes?: string | null
}

export type UpdatePersonalFinanceInput = {
  title: string
  amount: number
  date: string
  notes?: string | null
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

function coerceKind(raw: unknown): PersonalFinanceKind {
  const s = String(raw ?? "").toLowerCase()
  if (s === "income") return "income"
  if (s === "commitment") return "commitment"
  return "expense"
}

function normalizeItem(id: string, data: PersonalFinanceDoc): PersonalFinanceItem {
  return {
    id,
    kind: coerceKind(data.kind),
    title: data.title,
    amount: typeof data.amount === "number" && Number.isFinite(data.amount) ? data.amount : 0,
    date: typeof data.date === "string" ? normalizeCalendarDateString(data.date) : "",
    notes: data.notes ?? null,
    createdAt: tsToDate(data.createdAt),
    updatedAt: tsToDate(data.updatedAt),
  }
}

export async function getPersonalFinanceItems(ownerUid: string): Promise<PersonalFinanceItem[]> {
  const uid = requireOwnerUid(ownerUid)
  const db = requireDb()
  const q = query(collection(db, "personalFinance"), where("ownerUid", "==", uid))
  const snap = await firestoreReadWithRetry(() => getDocs(q), { label: "personalFinance" })
  const items = snap.docs.map((d) => normalizeItem(d.id, d.data() as PersonalFinanceDoc))
  items.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0)
  })
  return items
}

export async function addPersonalFinanceItem(
  ownerUid: string,
  input: CreatePersonalFinanceInput
): Promise<string> {
  const uid = requireOwnerUid(ownerUid)
  const db = requireDb()
  const title = input.title.trim()
  if (!title) throw new Error("Title is required")
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Invalid amount")
  const date = normalizeCalendarDateString(input.date.trim())
  if (!date) throw new Error("Date is required")

  const ref = await addDoc(collection(db, "personalFinance"), {
    ownerUid: uid,
    kind: input.kind,
    title,
    amount: input.amount,
    date,
    notes: input.notes?.trim() || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePersonalFinanceItem(
  itemId: string,
  input: UpdatePersonalFinanceInput
): Promise<void> {
  const db = requireDb()
  const ref = doc(db, "personalFinance", itemId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error("Item not found")
  const cur = snap.data() as PersonalFinanceDoc

  const title = input.title.trim()
  if (!title) throw new Error("Title is required")
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Invalid amount")
  const date = normalizeCalendarDateString(input.date.trim())
  if (!date) throw new Error("Date is required")

  await updateDoc(ref, {
    title,
    amount: input.amount,
    date,
    notes: input.notes?.trim() || null,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePersonalFinanceItem(itemId: string): Promise<void> {
  const db = requireDb()
  await deleteDoc(doc(db, "personalFinance", itemId))
}

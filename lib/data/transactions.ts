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
  type: TransactionType
  amount: number
  category: string
  description?: string | null
  date: string
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

function normalizeTransaction(id: string, docData: TransactionDoc): Transaction {
  return {
    id,
    projectId: docData.projectId,
    type: docData.type,
    amount: docData.amount,
    category: docData.category,
    description: docData.description ?? null,
    date: docData.date,
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

  const ref = await addDoc(collection(db, "transactions"), {
    ownerUid: uid,
    projectId: input.projectId,
    type: input.type,
    amount: input.amount,
    category: input.category.trim(),
    description: input.description?.trim() || null,
    date: input.date,
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

  // Single-field query avoids a composite index; filter project in memory.
  const q = query(collection(db, "transactions"), where("ownerUid", "==", uid))
  const snap = await getDocs(q)
  const items = snap.docs
    .map((d) => normalizeTransaction(d.id, d.data() as TransactionDoc))
    .filter((t) => t.projectId === projectId)

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
  const snap = await getDocs(q)
  const items = snap.docs.map((d) => normalizeTransaction(d.id, d.data() as TransactionDoc))

  items.sort((a, b) => {
    if (a.date !== b.date) return a.date > b.date ? -1 : 1
    const at = a.createdAt?.getTime() ?? 0
    const bt = b.createdAt?.getTime() ?? 0
    return bt - at
  })

  return items
}

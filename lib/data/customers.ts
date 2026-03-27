import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore"

import { clientDb } from "@/lib/firebase/client"

export type Customer = {
  id: string
  name: string
  phone: string | null
  notes: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

type CustomerDoc = {
  ownerUid?: string
  name: string
  phone?: string | null
  notes?: string | null
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type CreateCustomerInput = {
  name: string
  phone?: string | null
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

function normalizeCustomer(id: string, data: CustomerDoc): Customer {
  return {
    id,
    name: data.name,
    phone: data.phone ?? null,
    notes: data.notes ?? null,
    createdAt: tsToDate(data.createdAt),
    updatedAt: tsToDate(data.updatedAt),
  }
}

export async function getCustomers(ownerUid: string): Promise<Customer[]> {
  const uid = requireOwnerUid(ownerUid)
  const db = requireDb()
  const q = query(collection(db, "customers"), where("ownerUid", "==", uid))
  const snap = await getDocs(q)
  const items = snap.docs.map((d) => normalizeCustomer(d.id, d.data() as CustomerDoc))
  items.sort((a, b) => {
    const at = a.updatedAt?.getTime() ?? 0
    const bt = b.updatedAt?.getTime() ?? 0
    return bt - at
  })
  return items
}

export async function addCustomer(ownerUid: string, input: CreateCustomerInput): Promise<string> {
  const uid = requireOwnerUid(ownerUid)
  const db = requireDb()
  const ref = await addDoc(collection(db, "customers"), {
    ownerUid: uid,
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    notes: input.notes?.trim() || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteCustomerById(customerId: string): Promise<void> {
  const db = requireDb()
  await deleteDoc(doc(db, "customers", customerId))
}

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
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

export async function getCustomers(): Promise<Customer[]> {
  const db = requireDb()
  const q = query(collection(db, "customers"), orderBy("updatedAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => normalizeCustomer(d.id, d.data() as CustomerDoc))
}

export async function addCustomer(input: CreateCustomerInput): Promise<string> {
  const db = requireDb()
  const ref = await addDoc(collection(db, "customers"), {
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

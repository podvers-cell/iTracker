import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore"

import { clientDb } from "@/lib/firebase/client"
import { getCustomers } from "@/lib/data/customers"
import { getProjects } from "@/lib/data/projects"
import { getTransactions } from "@/lib/data/transactions"

function iso(d: Date | null) {
  return d ? d.toISOString() : null
}

export async function buildUserDataExport(ownerUid: string) {
  const [projects, customers, transactions] = await Promise.all([
    getProjects(ownerUid),
    getCustomers(ownerUid),
    getTransactions(ownerUid),
  ])

  return {
    exportMeta: {
      app: "iTrack",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      ownerUid,
    },
    projects: projects.map((p) => ({
      ...p,
      createdAt: iso(p.createdAt),
      updatedAt: iso(p.updatedAt),
    })),
    customers: customers.map((c) => ({
      ...c,
      createdAt: iso(c.createdAt),
      updatedAt: iso(c.updatedAt),
    })),
    transactions: transactions.map((t) => ({
      ...t,
      createdAt: iso(t.createdAt),
    })),
  }
}

export function downloadJsonFile(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const BATCH_SIZE = 400

/** Deletes all Firestore docs owned by the user (projects, customers, transactions). */
export async function deleteAllUserFirestoreData(ownerUid: string): Promise<void> {
  const db = clientDb()
  if (!db) throw new Error("Firebase is not configured")

  const collections = ["transactions", "customers", "projects"] as const

  for (const name of collections) {
    const q = query(collection(db, name), where("ownerUid", "==", ownerUid))
    const snap = await getDocs(q)
    let batch = writeBatch(db)
    let n = 0
    for (const d of snap.docs) {
      batch.delete(doc(db, name, d.id))
      n++
      if (n >= BATCH_SIZE) {
        await batch.commit()
        batch = writeBatch(db)
        n = 0
      }
    }
    if (n > 0) await batch.commit()
  }
}

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
  where,
} from "firebase/firestore"

import { clientDb } from "@/lib/firebase/client"

export type ProjectStatus = "active" | "on_hold" | "completed"

export type Project = {
  id: string
  name: string
  clientName: string | null
  location: string | null
  startDate: string | null
  expectedEndDate: string | null
  contractValue: number | null
  collectedAmount: number | null
  requiredScope: string | null
  status: ProjectStatus
  notes: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

type ProjectDoc = {
  ownerUid?: string
  name: string
  clientName?: string | null
  location?: string | null
  startDate?: string | null
  expectedEndDate?: string | null
  contractValue?: number | null
  collectedAmount?: number | null
  requiredScope?: string | null
  status?: ProjectStatus
  notes?: string | null
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

function tsToDate(ts?: Timestamp) {
  return ts ? ts.toDate() : null
}

function normalizeProject(id: string, docData: ProjectDoc): Project {
  return {
    id,
    name: docData.name,
    clientName: docData.clientName ?? null,
    location: docData.location ?? null,
    startDate: docData.startDate ?? null,
    expectedEndDate: docData.expectedEndDate ?? null,
    contractValue: typeof docData.contractValue === "number" ? docData.contractValue : null,
    collectedAmount: typeof docData.collectedAmount === "number" ? docData.collectedAmount : null,
    requiredScope: docData.requiredScope ?? null,
    status: docData.status ?? "active",
    notes: docData.notes ?? null,
    createdAt: tsToDate(docData.createdAt),
    updatedAt: tsToDate(docData.updatedAt),
  }
}

function requireDb() {
  console.log("[projects:data] requireDb()")
  const db = clientDb()
  if (!db) {
    console.error("[projects:data] Firebase clientDb() returned null")
    throw new Error(
      "Firebase is not configured. Check NEXT_PUBLIC_FIREBASE_* env vars."
    )
  }
  const projectId = (db as any)?._databaseId?.projectId ?? (db as any)?.app?.options?.projectId
  console.log("[projects:data] Firestore db ready", { projectId })
  return db
}

function requireOwnerUid(ownerUid: string | undefined) {
  const uid = ownerUid?.trim()
  if (!uid) throw new Error("Not signed in")
  return uid
}

export async function listProjects(ownerUid: string): Promise<Project[]> {
  const uid = requireOwnerUid(ownerUid)
  const db = requireDb()
  // Single-field equality only (no composite index). Sort in memory.
  const q = query(collection(db, "projects"), where("ownerUid", "==", uid))
  const snap = await getDocs(q)
  const items = snap.docs.map((d) => normalizeProject(d.id, d.data() as ProjectDoc))
  items.sort((a, b) => {
    const at = a.updatedAt?.getTime() ?? 0
    const bt = b.updatedAt?.getTime() ?? 0
    return bt - at
  })
  return items
}

export async function getProject(projectId: string): Promise<Project | null> {
  const db = requireDb()
  const ref = doc(db, "projects", projectId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return normalizeProject(snap.id, snap.data() as ProjectDoc)
}

export type CreateProjectInput = {
  name: string
  clientName?: string | null
  location?: string | null
  startDate?: string | null
  expectedEndDate?: string | null
  contractValue?: number | null
  collectedAmount?: number | null
  requiredScope?: string | null
  status?: ProjectStatus
  notes?: string | null
}

// Writes create the collection automatically (no manual setup required).
export async function addProject(ownerUid: string, input: CreateProjectInput): Promise<string> {
  console.log("[projects:data] createProject start", { input })
  const uid = requireOwnerUid(ownerUid)
  try {
    const db = requireDb()

    const payload = {
      ownerUid: uid,
      name: input.name.trim(),
      clientName: input.clientName?.trim() || null,
      location: input.location?.trim() || null,
      startDate: input.startDate || null,
      expectedEndDate: input.expectedEndDate || null,
      contractValue:
        typeof input.contractValue === "number" ? input.contractValue : null,
      collectedAmount:
        typeof input.collectedAmount === "number" ? input.collectedAmount : null,
      requiredScope: input.requiredScope?.trim() || null,
      status: input.status ?? "active",
      notes: input.notes?.trim() || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as const

    console.log("[projects:data] before addDoc", { payload })

    const writePromise = addDoc(collection(db, "projects"), payload)
    const timeoutMs = 15000
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`addDoc timed out after ${timeoutMs}ms`)), timeoutMs)
    })

    const ref = await Promise.race([writePromise, timeoutPromise])

    console.log("[projects:data] after addDoc success", { id: ref.id })
    console.log("[projects:data] before returning project id", { id: ref.id })
    return ref.id
  } catch (e) {
    console.error("[projects:data] createProject error", e)
    throw e
  }
}

// Preferred name used across the app.
export const createProject = addProject

export async function getProjects(ownerUid: string): Promise<Project[]> {
  return listProjects(ownerUid)
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  return getProject(projectId)
}

export async function deleteProjectById(projectId: string): Promise<void> {
  const db = requireDb()
  await deleteDoc(doc(db, "projects", projectId))
}

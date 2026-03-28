import { FirebaseApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
} from "firebase/firestore"

function getClientConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[firebase] Missing NEXT_PUBLIC_FIREBASE_* config", {
        hasApiKey: !!apiKey,
        hasAuthDomain: !!authDomain,
        hasProjectId: !!projectId,
        hasStorageBucket: !!storageBucket,
        hasMessagingSenderId: !!messagingSenderId,
        hasAppId: !!appId,
      })
    }
    return null
  }

  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }
}

export function firebaseClientApp(): FirebaseApp | null {
  const existing = getApps()[0]
  if (existing) return existing
  const config = getClientConfig()
  if (!config) return null
  if (process.env.NODE_ENV === "development") {
    console.log("[firebase] initializeApp", { projectId: config.projectId, authDomain: config.authDomain })
  }
  return initializeApp(config)
}

let _db: ReturnType<typeof initializeFirestore> | null = null

export function clientDb() {
  if (_db) return _db
  const app = firebaseClientApp()
  if (!app) return null

  // Helpful for debugging + environments where WebChannel is blocked.
  setLogLevel(process.env.NODE_ENV === "development" ? "debug" : "error")
  _db = initializeFirestore(app, {
    // IndexedDB cache: faster repeat loads + offline resilience (multi-tab sync).
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    // Long polling avoids WebChannel hangs behind some proxies / antivirus.
    experimentalForceLongPolling: true,
  })
  return _db
}

export function clientAuth() {
  const app = firebaseClientApp()
  if (!app) return null
  return getAuth(app)
}


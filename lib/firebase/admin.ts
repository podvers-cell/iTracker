import * as admin from "firebase-admin"

let _app: admin.app.App | null | undefined

/**
 * Optional Firebase Admin app (server-only).
 * Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the full JSON of a service account key
 * (Firebase console → Project settings → Service accounts → Generate new private key).
 */
export function getFirebaseAdminApp(): admin.app.App | null {
  if (_app !== undefined) return _app

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) {
    _app = null
    return null
  }

  try {
    if (admin.apps.length) {
      _app = admin.app()
    } else {
      const cred = JSON.parse(raw) as admin.ServiceAccount
      _app = admin.initializeApp({
        credential: admin.credential.cert(cred),
      })
    }
    return _app
  } catch (e) {
    console.error("[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON", e)
    _app = null
    return null
  }
}

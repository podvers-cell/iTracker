import * as admin from "firebase-admin"
import { NextResponse } from "next/server"

import { verifyFirebaseIdToken } from "@/lib/auth/verifyFirebaseIdToken"
import { getFirebaseAdminApp } from "@/lib/firebase/admin"

/**
 * POST — revoke all refresh tokens for the caller (sign-out everywhere).
 * Requires `Authorization: Bearer <Firebase ID token>`.
 * Server must have `FIREBASE_SERVICE_ACCOUNT_JSON` set.
 */
export async function POST(req: Request) {
  const authz = req.headers.get("authorization")
  const token = authz?.toLowerCase().startsWith("bearer ") ? authz.slice(7).trim() : null
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 401 })
  }

  let uid: string
  try {
    uid = await verifyFirebaseIdToken(token)
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 })
  }

  const app = getFirebaseAdminApp()
  if (!app) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 })
  }

  try {
    await admin.auth(app).revokeRefreshTokens(uid)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[revoke-all-sessions]", e)
    return NextResponse.json({ error: "revoke_failed" }, { status: 500 })
  }
}

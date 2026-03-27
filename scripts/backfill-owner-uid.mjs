/**
 * One-time migration: set ownerUid on legacy Firestore docs (before per-user rules).
 *
 * Prerequisites:
 * 1) Firebase Console → Project settings → Service accounts → Generate new private key
 *    Save the JSON file locally (do not commit it).
 * 2) Find your Auth UID: Console → Authentication → Users → User UID column
 *    (or in the app while logged in: browser devtools → temporary snippet below).
 *
 * Run (only documents missing ownerUid by default):
 *   export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/serviceAccountKey.json"
 *   export OWNER_UID="your_firebase_auth_uid"
 *   npm run backfill:owner-uid
 *
 * To overwrite ownerUid on every document in these collections (use with care):
 *   export BACKFILL_OVERWRITE=1
 *   npm run backfill:owner-uid
 *
 * Firestore Admin SDK bypasses security rules, so this restores access after rules require ownerUid.
 */

import { readFileSync } from "node:fs"
import { applicationDefault, cert, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

const OWNER_UID = process.env.OWNER_UID?.trim()
const OVERWRITE = process.env.BACKFILL_OVERWRITE === "1" || process.env.BACKFILL_OVERWRITE === "true"

function initAdmin() {
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()
  if (path) {
    const json = JSON.parse(readFileSync(path, "utf8"))
    initializeApp({ credential: cert(json) })
    return
  }
  initializeApp({ credential: applicationDefault() })
}

function needsBackfill(data) {
  const v = data?.ownerUid
  return typeof v !== "string" || v.trim() === ""
}

async function backfillCollection(db, name) {
  const snap = await db.collection(name).get()
  let updated = 0
  let skipped = 0
  for (const doc of snap.docs) {
    const data = doc.data()
    if (!OVERWRITE && !needsBackfill(data)) {
      skipped++
      continue
    }
    await doc.ref.update({ ownerUid: OWNER_UID })
    updated++
    console.log(`  ${name}/${doc.id}`)
  }
  console.log(`${name}: updated ${updated}, skipped ${skipped}, total ${snap.size}`)
}

async function main() {
  if (!OWNER_UID) {
    console.error("Missing OWNER_UID. Set it to your Firebase Auth user UID.")
    process.exit(1)
  }

  try {
    initAdmin()
  } catch (e) {
    console.error(
      "Failed to init Admin SDK. Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path,\n" +
        "or set FIREBASE_SERVICE_ACCOUNT_PATH to that file.",
    )
    console.error(e)
    process.exit(1)
  }

  const db = getFirestore()
  console.log(`ownerUid target: ${OWNER_UID}${OVERWRITE ? " (OVERWRITE all)" : " (only missing)"}\n`)

  await backfillCollection(db, "projects")
  await backfillCollection(db, "transactions")
  await backfillCollection(db, "customers")

  console.log("\nDone. Reload the app — your data should appear for this user.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

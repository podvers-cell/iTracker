/**
 * Verifies a Firebase ID token via Identity Toolkit (no Admin SDK).
 * @returns Firebase user localId (uid)
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) throw new Error("Firebase API key not configured")

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  )

  const data = (await res.json()) as { error?: { message?: string }; users?: Array<{ localId?: string }> }
  if (!res.ok) {
    throw new Error(data?.error?.message || "Invalid token")
  }

  const uid = data?.users?.[0]?.localId
  if (!uid) throw new Error("Invalid token")

  return uid
}

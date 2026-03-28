/**
 * Bounded Firestore reads: avoids indefinite hangs on flaky networks and retries transient failures.
 */

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`${label}: timed out after ${Math.round(ms / 1000)}s`)),
        ms
      )
    }),
  ])
}

type RetryOptions = {
  /** Per-attempt timeout (default 45s) */
  timeoutMs?: number
  /** Extra attempts after the first (default 2 → 3 tries total) */
  retries?: number
  label?: string
}

export async function firestoreReadWithRetry<T>(
  run: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 45_000
  const retries = options?.retries ?? 2
  const label = options?.label ?? "Firestore"

  let last: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(run(), timeoutMs, label)
    } catch (e) {
      last = e
      if (attempt === retries) break
      await sleep(350 * (attempt + 1))
    }
  }
  throw last
}

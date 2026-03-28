import { describe, expect, it, vi } from "vitest"

import { firestoreReadWithRetry, withTimeout } from "@/lib/firebase/firestore-read"

describe("withTimeout", () => {
  it("resolves when promise settles in time", async () => {
    await expect(withTimeout(Promise.resolve(42), 1000, "t")).resolves.toBe(42)
  })

  it("rejects when promise hangs", async () => {
    vi.useFakeTimers()
    const p = withTimeout(new Promise(() => {}), 50, "slow")
    const assertion = expect(p).rejects.toThrow(/timed out/)
    await vi.advanceTimersByTimeAsync(60)
    await assertion
    vi.useRealTimers()
  })
})

describe("firestoreReadWithRetry", () => {
  it("returns on first success", async () => {
    let n = 0
    const r = await firestoreReadWithRetry(async () => {
      n++
      return 7
    }, { retries: 2, timeoutMs: 2000 })
    expect(r).toBe(7)
    expect(n).toBe(1)
  })

  it("retries then succeeds", async () => {
    let n = 0
    const r = await firestoreReadWithRetry(async () => {
      n++
      if (n < 2) throw new Error("fail")
      return "ok"
    }, { retries: 2, timeoutMs: 2000, label: "x" })
    expect(r).toBe("ok")
    expect(n).toBe(2)
  })
})

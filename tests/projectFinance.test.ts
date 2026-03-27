import { describe, expect, it } from "vitest"

import { projectCollectedTotal, projectUncollected } from "@/lib/data/projectFinance"

describe("projectCollectedTotal", () => {
  it("sums collectedAmount and income transaction total", () => {
    expect(projectCollectedTotal(1000, 500)).toBe(1500)
    expect(projectCollectedTotal(null, 400)).toBe(400)
    expect(projectCollectedTotal(undefined, 0)).toBe(0)
  })

  it("treats non-finite income sum as 0", () => {
    expect(projectCollectedTotal(100, Number.NaN)).toBe(100)
  })
})

describe("projectUncollected", () => {
  it("returns contract minus collected, floored at 0", () => {
    expect(projectUncollected(10_000, 3000)).toBe(7000)
    expect(projectUncollected(10_000, 10_000)).toBe(0)
    expect(projectUncollected(10_000, 12_000)).toBe(0)
  })

  it("returns null when contract value is unknown", () => {
    expect(projectUncollected(null, 100)).toBeNull()
    expect(projectUncollected(undefined, 100)).toBeNull()
  })
})

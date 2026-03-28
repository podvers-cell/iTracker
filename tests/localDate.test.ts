import { describe, expect, it } from "vitest"

import {
  calendarDateFromCompactNumber,
  eachLocalDayIsoInclusive,
  normalizeCalendarDateString,
} from "@/lib/dates/localDate"

describe("normalizeCalendarDateString", () => {
  it("pads loose month and day", () => {
    expect(normalizeCalendarDateString("2026-3-5")).toBe("2026-03-05")
    expect(normalizeCalendarDateString("2026-12-28")).toBe("2026-12-28")
  })

  it("keeps already strict ISO dates", () => {
    expect(normalizeCalendarDateString("2026-03-28")).toBe("2026-03-28")
  })

  it("strips ISO datetime to calendar day", () => {
    expect(normalizeCalendarDateString("2026-03-28T14:30:00.000Z")).toBe("2026-03-28")
    expect(normalizeCalendarDateString("2026-03-28T00:00:00.000Z")).toBe("2026-03-28")
  })

  it("parses compact YYYYMMDD strings", () => {
    expect(normalizeCalendarDateString("20260328")).toBe("2026-03-28")
    expect(normalizeCalendarDateString("2026-03-28")).toBe("2026-03-28")
  })
})

describe("calendarDateFromCompactNumber", () => {
  it("maps 8-digit calendar integers", () => {
    expect(calendarDateFromCompactNumber(20260328)).toBe("2026-03-28")
  })
})

describe("eachLocalDayIsoInclusive", () => {
  it("accepts ISO datetime bounds", () => {
    const days = eachLocalDayIsoInclusive("2026-03-26T00:00:00.000Z", "2026-03-28")
    expect(days).toEqual(["2026-03-26", "2026-03-27", "2026-03-28"])
  })
})

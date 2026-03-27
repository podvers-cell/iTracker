import { describe, expect, it } from "vitest"

import { normalizeDigitsToWestern, parseLocalizedAmount } from "@/lib/format/numericInput"

describe("normalizeDigitsToWestern", () => {
  it("converts Arabic-Indic digits", () => {
    expect(normalizeDigitsToWestern("١٢٣٤٫٥٦")).toBe("1234٫56")
  })

  it("converts Persian digits", () => {
    expect(normalizeDigitsToWestern("۱۲۳")).toBe("123")
  })

  it("leaves Western digits unchanged", () => {
    expect(normalizeDigitsToWestern("1,234.56")).toBe("1,234.56")
  })
})

describe("parseLocalizedAmount", () => {
  it("parses Western decimals and strips grouping commas", () => {
    expect(parseLocalizedAmount("1,250.5")).toBe(1250.5)
    expect(parseLocalizedAmount("  42  ")).toBe(42)
  })

  it("parses Arabic decimal and thousands separators after digit normalization", () => {
    expect(parseLocalizedAmount("١٬٢٥٠٫٥")).toBe(1250.5)
  })

  it("treats empty string as 0 and rejects non-numeric text", () => {
    expect(parseLocalizedAmount("")).toBe(0)
    expect(Number.isNaN(parseLocalizedAmount("abc"))).toBe(true)
  })
})

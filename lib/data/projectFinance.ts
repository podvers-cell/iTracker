/** Sum of amounts collected: optional project field + income transactions for that project. */
export function projectCollectedTotal(
  collectedAmount: number | null | undefined,
  incomeTransactionsSum: number
): number {
  const fromField = typeof collectedAmount === "number" ? collectedAmount : 0
  const fromTx = Number.isFinite(incomeTransactionsSum) ? incomeTransactionsSum : 0
  return fromField + fromTx
}

/** Remaining contract balance to collect (never negative). */
export function projectUncollected(
  contractValue: number | null | undefined,
  collectedTotal: number
): number | null {
  if (contractValue == null || typeof contractValue !== "number") return null
  return Math.max(0, contractValue - collectedTotal)
}

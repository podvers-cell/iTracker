/** Stable codes for client-side mapping to localized messages. */
export const DateValidationCode = {
  PAST_CALENDAR_DATE: "PAST_CALENDAR_DATE",
  PAST_DATETIME: "PAST_DATETIME",
} as const

export type DateValidationCodeType = (typeof DateValidationCode)[keyof typeof DateValidationCode]

// Appwrite-compatible query builders and id helpers, backed by Postgres.
// Pure module (no database access) so it can be imported anywhere, including tests.
import { randomBytes } from "crypto"

export type QueryValue = string | number | boolean | null
export type DbQuery =
  | { op: "equal"; field: string; value: QueryValue | QueryValue[] }
  | { op: "greaterThanEqual" | "lessThanEqual" | "greaterThan" | "lessThan"; field: string; value: QueryValue }
  | { op: "orderAsc" | "orderDesc"; field: string }
  | { op: "limit"; value: number }
  | { op: "offset"; value: number }
  | { op: "cursorAfter"; value: string }
  | { op: "select"; fields: string[] }

export const Query = {
  equal: (field: string, value: QueryValue | QueryValue[]): DbQuery => ({ op: "equal", field, value }),
  greaterThanEqual: (field: string, value: QueryValue): DbQuery => ({ op: "greaterThanEqual", field, value }),
  lessThanEqual: (field: string, value: QueryValue): DbQuery => ({ op: "lessThanEqual", field, value }),
  greaterThan: (field: string, value: QueryValue): DbQuery => ({ op: "greaterThan", field, value }),
  lessThan: (field: string, value: QueryValue): DbQuery => ({ op: "lessThan", field, value }),
  orderAsc: (field: string): DbQuery => ({ op: "orderAsc", field }),
  orderDesc: (field: string): DbQuery => ({ op: "orderDesc", field }),
  limit: (value: number): DbQuery => ({ op: "limit", value }),
  offset: (value: number): DbQuery => ({ op: "offset", value }),
  cursorAfter: (id: string): DbQuery => ({ op: "cursorAfter", value: id }),
  /** Accepted for call-site compatibility; rows are always returned whole. */
  select: (fields: string[]): DbQuery => ({ op: "select", fields }),
}

export const ID = {
  /** 20 hex chars: fits Appwrite's id rules, so ids stay interchangeable. */
  unique: (): string => randomBytes(10).toString("hex"),
}

/** Error with an Appwrite-style HTTP code (404 not found, 409 conflict). */
export class DbError extends Error {
  code: number
  type: string
  constructor(code: number, message: string, type = code === 404 ? "document_not_found" : code === 409 ? "document_already_exists" : "general_error") {
    super(message)
    this.name = "DbError"
    this.code = code
    this.type = type
  }
}

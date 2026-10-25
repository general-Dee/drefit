// Shared Postgres helpers for the maintenance scripts (migrate, seed, import).
import { readFileSync } from "node:fs"
import pg from "pg"

/** Direct (unpooled) URL preferred for scripts: advisory locks + DDL need a real session. */
export function scriptDatabaseUrl(env = process.env) {
  return env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL || env.POSTGRES_URL || ""
}

function needsSsl(url) {
  try {
    const u = new URL(url)
    if (u.searchParams.get("sslmode") === "disable") return false
    return !["localhost", "127.0.0.1", "::1"].includes(u.hostname)
  } catch {
    return true
  }
}

export async function connect(url = scriptDatabaseUrl()) {
  if (!url) throw new Error("DATABASE_URL is not set")
  const client = new pg.Client({ connectionString: url, ssl: needsSsl(url) ? { rejectUnauthorized: true } : undefined })
  await client.connect()
  return client
}

/** Redacted description of a connection URL: host + db only, never credentials. */
export function describeUrl(url) {
  try {
    const u = new URL(url)
    return `${u.hostname}/${u.pathname.replace(/^\//, "")}`
  } catch {
    return "(unparseable url)"
  }
}

/** Logical collection -> { table, fields: { field: [column, type] } } (shared with the app). */
export const COLLECTIONS = JSON.parse(readFileSync(new URL("../../src/lib/db/collections.json", import.meta.url), "utf8"))

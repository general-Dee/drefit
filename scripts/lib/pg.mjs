// Shared Postgres helpers for the maintenance scripts (migrate, seed, import).
import { readFileSync } from "node:fs"
import pg from "pg"

/** Direct (unpooled) URL preferred for scripts: advisory locks + DDL need a real session. */
// Prefer the direct (non-pooled) URL for DDL/advisory locks, but only when it
// points at the same database as DATABASE_URL. That way overriding
// DATABASE_URL (e.g. to a local Postgres) never silently falls through to a
// remote unpooled URL left over in .env.local.
export function scriptDatabaseUrl(env = process.env) {
  const main = env.DATABASE_URL || env.POSTGRES_URL || ""
  const direct = env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || ""
  if (!main) return direct
  if (direct && sameDatabase(main, direct)) return direct
  return main
}

function sameDatabase(a, b) {
  try {
    const x = new URL(a), y = new URL(b)
    const host = (u) => u.hostname.replace("-pooler.", ".")
    return host(x) === host(y) && x.pathname === y.pathname
  } catch {
    return false
  }
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

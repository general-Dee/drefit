import { Pool, types } from "pg"

// Return numeric/bigint counts as JS numbers (count(*) is bigint).
types.setTypeParser(20, (v) => Number(v))

let pool: Pool | null = null

export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined
}

function needsSsl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.searchParams.get("sslmode") === "disable") return false
    return !["localhost", "127.0.0.1", "::1"].includes(u.hostname)
  } catch {
    return true
  }
}

/** Lazily-created shared pool. Throws a clear error when DATABASE_URL is unset. */
export function getPool(): Pool {
  if (pool) return pool
  const url = databaseUrl()
  if (!url) throw new Error("DATABASE_URL is not set: the Postgres database is not configured")
  pool = new Pool({
    connectionString: url,
    max: Number(process.env.PG_POOL_MAX ?? 5),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: needsSsl(url) ? { rejectUnauthorized: true } : undefined,
  })
  return pool
}

/** Test/script helper: close the shared pool. */
export async function closePool(): Promise<void> {
  if (pool) {
    const p = pool
    pool = null
    await p.end()
  }
}

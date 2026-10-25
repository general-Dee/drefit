// Schema migration for the Postgres (Neon) database. Runs before `next build`
// (the npm "prebuild" hook) and can be run by hand:
//
//   node --env-file=.env.local scripts/migrate-db.mjs
//
// * Applies db/migrations/*.sql in name order, each once, recorded in the
//   schema_migrations table. Migrations are written to be idempotent and
//   non-destructive (CREATE ... IF NOT EXISTS only), so re-running is safe.
// * Schema only: never inserts or deletes app data.
// * Skips gracefully when DATABASE_URL is not set (e.g. local builds), and
//   only warns when the database is unreachable, so a paused database never
//   blocks a deploy. Set MIGRATE_STRICT=1 to make both of those fatal.
import { createHash } from "node:crypto"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { connect, describeUrl, scriptDatabaseUrl } from "./lib/pg.mjs"

const strict = process.env.MIGRATE_STRICT === "1"
const log = (m) => console.log(`[migrate-db] ${m}`)
const dir = fileURLToPath(new URL("../db/migrations/", import.meta.url))
const LOCK_KEY = 4_206_913_377 // arbitrary app-wide advisory lock id

export async function migrate(url = scriptDatabaseUrl(), { quiet = false } = {}) {
  const say = quiet ? () => {} : log
  const client = await connect(url)
  try {
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_KEY]) // serialise concurrent builds
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
    const done = new Map((await client.query("SELECT name, checksum FROM schema_migrations")).rows.map((r) => [r.name, r.checksum]))
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
    let applied = 0
    for (const file of files) {
      const sql = readFileSync(join(dir, file), "utf8")
      const checksum = createHash("sha256").update(sql).digest("hex").slice(0, 16)
      if (done.has(file)) {
        if (done.get(file) !== checksum) say(`WARNING: ${file} changed since it was applied; not re-running (add a new migration instead).`)
        continue
      }
      await client.query("BEGIN")
      try {
        await client.query(sql)
        await client.query("INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)", [file, checksum])
        await client.query("COMMIT")
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {})
        throw new Error(`${file}: ${err.message}`)
      }
      applied++
      say(`applied ${file}`)
    }
    say(applied ? `done (${applied} applied, ${files.length} total)` : `up to date (${files.length} migrations)`)
    return applied
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_KEY]).catch(() => {})
    await client.end()
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const url = scriptDatabaseUrl()
  if (!url) {
    if (strict) {
      console.error("[migrate-db] FAILED: DATABASE_URL is not set (MIGRATE_STRICT=1).")
      process.exit(1)
    }
    log("DATABASE_URL not set, skipping schema migration.")
    process.exit(0)
  }
  log(`target ${describeUrl(url)}`)
  try {
    await migrate(url)
  } catch (err) {
    const msg = err?.message || err?.code || err?.errors?.[0]?.message || String(err)
    if (strict) {
      console.error(`[migrate-db] FAILED: ${msg}`)
      process.exit(1)
    }
    console.warn(`[migrate-db] WARNING: schema migration skipped: ${msg}`)
    console.warn("[migrate-db] Re-run once the database is reachable: node --env-file=.env.local scripts/migrate-db.mjs")
  }
}

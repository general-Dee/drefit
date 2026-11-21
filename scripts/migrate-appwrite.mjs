// Schema-only migration (no sample data). Runs before `next build` so that
// collections the new code depends on exist before it goes live. Skips when
// Appwrite credentials are not present (e.g. local builds).
//
// Run manually with: node --env-file=.env.local scripts/migrate-appwrite.mjs
import { Client, Databases } from "node-appwrite"
import { ensureSecuritySchema } from "./appwrite-security-schema.mjs"
import { ensureUpgradesSchema } from "./appwrite-upgrades-schema.mjs"

const { NEXT_PUBLIC_APPWRITE_ENDPOINT: endpoint, NEXT_PUBLIC_APPWRITE_PROJECT_ID: project, APPWRITE_API_KEY: key, NEXT_PUBLIC_APPWRITE_DATABASE_ID: databaseId } = process.env

if (!endpoint || !project || !key || !databaseId) {
  console.log("[migrate-appwrite] Appwrite env not set, skipping schema migration.")
  process.exit(0)
}

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key)
try {
  console.log("[migrate-appwrite] Ensuring security collections...")
  const databases = new Databases(client)
  const log = (m) => console.log(`[migrate-appwrite]${m}`)
  await ensureSecuritySchema(databases, databaseId, log)
  console.log("[migrate-appwrite] Ensuring upgrade collections/attributes...")
  await ensureUpgradesSchema(databases, databaseId, log)
  console.log("[migrate-appwrite] Done.")
} catch (err) {
  // Don't block deploys on an unreachable/paused Appwrite project: the code
  // paths that depend on these collections fail safe until they exist
  // (payments are not granted without an idempotency record; login falls back
  // to the in-memory limiter). Set MIGRATE_STRICT=1 to make this fatal.
  const msg = err?.message ?? String(err)
  if (process.env.MIGRATE_STRICT === "1") {
    console.error(`[migrate-appwrite] FAILED: ${msg}`)
    process.exit(1)
  }
  console.warn(`[migrate-appwrite] WARNING: schema migration skipped: ${msg}`)
  console.warn("[migrate-appwrite] Re-run once Appwrite is reachable (redeploy, or node --env-file=.env.local scripts/migrate-appwrite.mjs).")
}

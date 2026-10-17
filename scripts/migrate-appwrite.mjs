// Schema-only migration (no sample data). Runs before `next build` so that
// collections the new code depends on exist before it goes live. Skips when
// Appwrite credentials are not present (e.g. local builds).
//
// Run manually with: node --env-file=.env.local scripts/migrate-appwrite.mjs
import { Client, Databases } from "node-appwrite"
import { ensureSecuritySchema } from "./appwrite-security-schema.mjs"

const { NEXT_PUBLIC_APPWRITE_ENDPOINT: endpoint, NEXT_PUBLIC_APPWRITE_PROJECT_ID: project, APPWRITE_API_KEY: key, NEXT_PUBLIC_APPWRITE_DATABASE_ID: databaseId } = process.env

if (!endpoint || !project || !key || !databaseId) {
  console.log("[migrate-appwrite] Appwrite env not set, skipping schema migration.")
  process.exit(0)
}

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key)
try {
  console.log("[migrate-appwrite] Ensuring security collections...")
  await ensureSecuritySchema(new Databases(client), databaseId, (m) => console.log(`[migrate-appwrite]${m}`))
  console.log("[migrate-appwrite] Done.")
} catch (err) {
  console.error(`[migrate-appwrite] FAILED: ${err?.message ?? err}`)
  process.exit(1)
}

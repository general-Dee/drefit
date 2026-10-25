// Imports Appwrite collection exports (JSON or CSV) into Postgres, keeping
// every document id ($id) and $createdAt unchanged so all cross references
// (userId, postId, referredBy, ...) keep working. bcrypt password hashes are
// copied as-is, so existing members keep their passwords.
//
//   node --env-file=.env.local scripts/import-appwrite.mjs <export-dir> [--dry-run] [--confirm]
//
// <export-dir> holds one file per collection, named after the collection id:
//   users.json | users.csv, progressLogs.json, progressPhotos.json, workouts.json,
//   workoutCompletions.json, dietPlans.json, communityPosts.json,
//   communityComments.json, coachingMessages.json, loginAttempts.json,
//   paymentEvents.json, reminderLog.json, referrals.json, firstWeekPlans.json
// Missing files are skipped. JSON may be an array of documents or an Appwrite
// list response ({ "documents": [...] }), or one document per line (NDJSON).
//
// Safe to re-run: rows whose id (or a unique key such as a payment reference
// or referral code) already exists are skipped, never overwritten. Nothing is
// deleted. Each file is imported in its own transaction.
// --dry-run parses and validates without writing.
// --confirm is required for any non-local database (Preview and Production
// share the same Neon database).
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { COLLECTIONS, connect, describeUrl, scriptDatabaseUrl } from "./lib/pg.mjs"
import { migrate } from "./migrate-db.mjs"

const IGNORED = new Set(["$permissions", "$collectionId", "$databaseId", "$sequence", "$tenant", "$internalId"])

// --- tiny RFC 4180 CSV parser ---
export function parseCsv(text) {
  const rows = []
  let row = [], field = "", i = 0, quoted = false
  text = text.replace(/^\uFEFF/, "")
  while (i < text.length) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue }
        quoted = false; i++; continue
      }
      field += ch; i++; continue
    }
    if (ch === '"') { quoted = true; i++; continue }
    if (ch === ",") { row.push(field); field = ""; i++; continue }
    if (ch === "\r") { i++; continue }
    if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue }
    field += ch; i++
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row) }
  const [header, ...body] = rows.filter((r) => r.length > 1 || r[0] !== "")
  if (!header) return []
  return body.map((r) => Object.fromEntries(header.map((h, j) => [h.trim(), r[j] ?? ""])))
}

export function readExport(dir, collection) {
  for (const ext of ["json", "ndjson", "csv"]) {
    const p = join(dir, `${collection}.${ext}`)
    if (!existsSync(p)) continue
    const text = readFileSync(p, "utf8")
    if (ext === "csv") return { file: p, docs: parseCsv(text), fromCsv: true }
    const trimmed = text.trim()
    if (!trimmed) return { file: p, docs: [], fromCsv: false }
    if (ext === "ndjson" || (!trimmed.startsWith("[") && !trimmed.startsWith("{\"documents\"") && trimmed.includes("\n{"))) {
      return { file: p, docs: trimmed.split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)), fromCsv: false }
    }
    const parsed = JSON.parse(trimmed)
    const docs = Array.isArray(parsed) ? parsed : Array.isArray(parsed.documents) ? parsed.documents : [parsed]
    return { file: p, docs, fromCsv: false }
  }
  return null
}

/** Convert one exported value to the Postgres column type. CSV values are strings. */
export function convert(type, value, fromCsv) {
  if (value === undefined || value === null) return null
  if (fromCsv && value === "" && type !== "text") return null
  switch (type) {
    case "int": {
      const n = Number(value)
      if (!Number.isFinite(n)) throw new Error(`not an integer: ${value}`)
      return Math.trunc(n)
    }
    case "float": {
      const n = Number(value)
      if (!Number.isFinite(n)) throw new Error(`not a number: ${value}`)
      return n
    }
    case "bool":
      if (typeof value === "boolean") return value
      if (/^(true|1|yes)$/i.test(String(value))) return true
      if (/^(false|0|no)$/i.test(String(value))) return false
      throw new Error(`not a boolean: ${value}`)
    case "timestamptz": {
      if (value === "") return null
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) throw new Error(`not a datetime: ${value}`)
      return d.toISOString()
    }
    case "text[]": {
      if (Array.isArray(value)) return value.map(String)
      const s = String(value).trim()
      if (!s) return []
      if (s.startsWith("[")) return JSON.parse(s).map(String)
      return s.split(/[,;]/).map((x) => x.trim()).filter(Boolean)
    }
    default:
      return typeof value === "string" ? value : JSON.stringify(value)
  }
}

/** Map an exported Appwrite document to { columns: [...], values: [...] }. */
export function toRow(collection, doc, fromCsv, warn = () => {}) {
  const { fields } = COLLECTIONS[collection]
  const cols = new Map()
  for (const [key, raw] of Object.entries(doc)) {
    if (IGNORED.has(key)) continue
    const f = fields[key]
    if (!f) { warn(key); continue }
    const [column, type] = f
    // App-level createdAt shares created_at with $createdAt; the app value wins.
    if (key === "$createdAt" && cols.has(column)) continue
    const v = convert(type, raw, fromCsv)
    if (column === "created_at" || column === "updated_at") { if (v === null) continue }
    cols.set(column, v)
  }
  if (!cols.get("id")) throw new Error("document has no $id")
  return { columns: [...cols.keys()], values: [...cols.values()] }
}

async function main() {
  const args = process.argv.slice(2)
  const dir = args.find((a) => !a.startsWith("--"))
  const dryRun = args.includes("--dry-run")
  const confirmed = args.includes("--confirm")
  if (!dir || !existsSync(dir)) {
    console.error("usage: node --env-file=.env.local scripts/import-appwrite.mjs <export-dir> [--dry-run] [--confirm]")
    process.exit(1)
  }
  const url = scriptDatabaseUrl()
  if (!url) { console.error("DATABASE_URL is not set"); process.exit(1) }
  const host = describeUrl(url)
  const local = /^(localhost|127\.0\.0\.1|::1)\//.test(host)
  console.log(`[import] target ${host}${dryRun ? " (dry run)" : ""}`)
  if (!local && !dryRun && !confirmed) {
    console.error("[import] Refusing to write to a non-local database without --confirm (Preview and Production share it).")
    process.exit(1)
  }

  if (!dryRun) await migrate(url, { quiet: true })
  const client = dryRun ? null : await connect(url)
  const summary = []
  let failed = false
  try {
    for (const collection of Object.keys(COLLECTIONS)) {
      const exp = readExport(dir, collection)
      if (!exp) continue
      const { table } = COLLECTIONS[collection]
      const unknown = new Set()
      let inserted = 0, skipped = 0
      const conflicts = []
      const rows = []
      try {
        exp.docs.forEach((doc, i) => {
          try {
            rows.push(toRow(collection, doc, exp.fromCsv, (k) => unknown.add(k)))
          } catch (err) {
            throw new Error(`row ${i + 1} (${doc?.$id ?? "no id"}): ${err.message}`)
          }
        })
        if (client) {
          await client.query("BEGIN")
          for (const r of rows) {
            const sql = `INSERT INTO ${table} (${r.columns.map((c) => `"${c}"`).join(", ")}) VALUES (${r.columns.map((_, j) => `$${j + 1}`).join(", ")}) ON CONFLICT DO NOTHING`
            const res = await client.query(sql, r.values)
            if (res.rowCount) inserted++
            else {
              const id = r.values[r.columns.indexOf("id")]
              const exists = await client.query(`SELECT 1 FROM ${table} WHERE id = $1`, [id])
              if (exists.rowCount) skipped++
              else conflicts.push(id) // clashed on another unique key (reference, referral code, ...)
            }
          }
          await client.query("COMMIT")
        }
        summary.push(`${collection}: ${rows.length} read, ${client ? `${inserted} inserted, ${skipped} skipped (already present)` : "validated"}`)
        if (conflicts.length) summary.push(`  NOT imported (duplicate unique key, review by hand): ${conflicts.join(", ")}`)
        if (unknown.size) summary.push(`  ignored unknown fields: ${[...unknown].join(", ")}`)
      } catch (err) {
        failed = true
        if (client) await client.query("ROLLBACK").catch(() => {})
        summary.push(`${collection}: FAILED, nothing written for this file (${err.message})`)
      }
    }
  } finally {
    if (client) await client.end()
  }
  console.log(summary.length ? summary.join("\n") : "[import] no export files found")
  if (failed) process.exit(1)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

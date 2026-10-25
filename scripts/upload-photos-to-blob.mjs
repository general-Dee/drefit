// Re-uploads progress photos exported from the Appwrite "progress-photos"
// bucket into the private Vercel Blob store, and links each one to its
// progress_photos row (blob_pathname + content_type).
//
//   node --env-file=.env.local scripts/upload-photos-to-blob.mjs <photos-dir> [--dry-run] [--confirm]
//
// Run AFTER scripts/import-appwrite.mjs has imported progressPhotos. Files in
// <photos-dir> must be named by their Appwrite file id (the row's fileId),
// with or without an extension, e.g. 6650f1c2000a1b2c3d4e.jpg.
// Safe to re-run: rows that already have a blob_pathname are skipped. Never
// deletes anything. Needs DATABASE_URL and BLOB_READ_WRITE_TOKEN.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { extname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { put } from "@vercel/blob"
import { connect, describeUrl, scriptDatabaseUrl } from "./lib/pg.mjs"

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const PREFIX = "progress-photos" // keep in sync with PROGRESS_PHOTOS_BLOB_PREFIX
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/heic": "heic", "image/heif": "heif", "image/avif": "avif" }

/** Same rule as photoPathname() in src/lib/photo-storage.ts. */
export function photoPathname(userId, fileId, contentType) {
  const safe = (s) => String(s).replace(/[^A-Za-z0-9_-]/g, "_")
  return `${PREFIX}/${safe(userId)}/${safe(fileId)}.${EXT[contentType] ?? "img"}`
}

export function sniffImageType(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg"
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png"
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp"
  if (buf.length >= 6 && buf.toString("ascii", 0, 3) === "GIF") return "image/gif"
  if (buf.length >= 12 && buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12)
    if (brand.startsWith("avi")) return "image/avif"
    if (/^(heic|heix|hevc|mif1|msf1)/.test(brand)) return "image/heic"
  }
  return null
}

async function main() {
  const args = process.argv.slice(2)
  const dir = args.find((a) => !a.startsWith("--"))
  const dryRun = args.includes("--dry-run")
  if (!dir) {
    console.error("usage: node --env-file=.env.local scripts/upload-photos-to-blob.mjs <photos-dir> [--dry-run] [--confirm]")
    process.exit(1)
  }
  const url = scriptDatabaseUrl()
  if (!url) { console.error("DATABASE_URL is not set"); process.exit(1) }
  if (!dryRun && !process.env.BLOB_READ_WRITE_TOKEN) { console.error("BLOB_READ_WRITE_TOKEN is not set"); process.exit(1) }
  const host = describeUrl(url)
  if (!/^(localhost|127\.0\.0\.1|::1)\//.test(host) && !dryRun && !args.includes("--confirm")) {
    console.error("[photos] Refusing to write to a non-local database without --confirm.")
    process.exit(1)
  }
  console.log(`[photos] database ${host}${dryRun ? " (dry run)" : ""}`)

  // fileId -> path (extension ignored)
  const files = new Map()
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (!statSync(p).isFile()) continue
    files.set(name.slice(0, name.length - extname(name).length) || name, p)
    files.set(name, p)
  }

  const client = await connect(url)
  let uploaded = 0, missing = 0, rejected = 0
  try {
    const { rows } = await client.query("SELECT id, user_id, file_id FROM progress_photos WHERE blob_pathname IS NULL ORDER BY taken_at")
    console.log(`[photos] ${rows.length} photo rows without a blob`)
    for (const row of rows) {
      const p = files.get(row.file_id)
      if (!p) { missing++; console.warn(`  missing file for fileId ${row.file_id}`); continue }
      const buf = readFileSync(p)
      const type = sniffImageType(buf)
      if (!type || buf.length > MAX_PHOTO_BYTES) {
        rejected++
        console.warn(`  skipped ${row.file_id}: ${!type ? "not a recognised image" : "larger than 5MB"}`)
        continue
      }
      const pathname = photoPathname(row.user_id, row.file_id, type)
      if (dryRun) { uploaded++; console.log(`  would upload ${row.file_id} -> ${pathname}`); continue }
      await put(pathname, buf, { access: "private", contentType: type, addRandomSuffix: false, allowOverwrite: true })
      await client.query("UPDATE progress_photos SET blob_pathname = $2, content_type = $3, updated_at = now() WHERE id = $1 AND blob_pathname IS NULL", [row.id, pathname, type])
      uploaded++
    }
  } finally {
    await client.end()
  }
  console.log(`[photos] ${dryRun ? "would upload" : "uploaded"} ${uploaded}, missing ${missing}, skipped ${rejected}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

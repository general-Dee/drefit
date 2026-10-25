// Progress photos live in a PRIVATE Vercel Blob store. Blobs are never
// exposed by URL: the app streams them through /api/progress/photos/[fileId]
// after checking the signed-in member owns the photo.
import { get, put } from "@vercel/blob"
import { PROGRESS_PHOTOS_BLOB_PREFIX } from "@/lib/db/schema"

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

export function photoStorageConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.BLOB_READ_WRITE_TOKEN)
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/avif": "avif",
}

/** Deterministic pathname: progress-photos/<userId>/<fileId>.<ext> */
export function photoPathname(userId: string, fileId: string, contentType: string): string {
  const safe = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, "_")
  return `${PROGRESS_PHOTOS_BLOB_PREFIX}/${safe(userId)}/${safe(fileId)}.${EXT[contentType] ?? "img"}`
}

export async function storePhoto(pathname: string, body: Buffer | Blob | ReadableStream, contentType: string) {
  return put(pathname, body, {
    access: "private",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

/** Returns null when the blob does not exist. */
export async function readPhoto(pathname: string) {
  const res = await get(pathname, { access: "private" })
  if (!res || res.statusCode !== 200) return null
  return res
}

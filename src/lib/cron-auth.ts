import { timingSafeEqual } from "crypto"

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Without a
// configured secret every request is rejected.
export function isAuthorizedCron(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret || !authHeader) return false
  const a = Buffer.from(authHeader)
  const b = Buffer.from(`Bearer ${secret}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

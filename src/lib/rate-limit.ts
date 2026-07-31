type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}

export interface RateLimitResult {
  success: boolean
  resetAt: number
}

// In-memory fixed-window limiter, per server instance — resets on redeploy/cold
// start and isn't shared across serverless instances, but needs no extra infra.
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { success: true, resetAt }
  }
  if (bucket.count >= limit) {
    return { success: false, resetAt: bucket.resetAt }
  }
  bucket.count += 1
  return { success: true, resetAt: bucket.resetAt }
}

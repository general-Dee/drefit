import { createHash } from "crypto"
import { db } from "@/lib/db/client"
import { LOGIN_ATTEMPTS_COLLECTION_ID, type LoginAttemptDoc } from "@/lib/db/schema"

// Persistent (Postgres-backed) login throttling, so limits survive cold starts
// and are shared across serverless instances. Failures are counted for every
// submitted email whether or not an account exists, and the caller returns the
// same generic error either way, so lockouts don't reveal which emails exist.

export interface ThrottlePolicy {
  maxFailures: number
  windowMs: number
  lockMs: number
}

const MIN = 60 * 1000
// Per IP + email: stops a single client hammering one account.
export const IP_EMAIL_POLICY: ThrottlePolicy = { maxFailures: 5, windowMs: 15 * MIN, lockMs: 15 * MIN }
// Per email (any IP): stops distributed guessing against one account.
export const EMAIL_POLICY: ThrottlePolicy = { maxFailures: 20, windowMs: 15 * MIN, lockMs: 30 * MIN }

export interface AttemptState {
  failures: number
  windowStart: number
  lockedUntil: number | null
}

export function isLocked(state: AttemptState | null, now: number): boolean {
  return !!state?.lockedUntil && state.lockedUntil > now
}

// Pure: state after one more failure.
export function recordFailureState(prev: AttemptState | null, now: number, policy: ThrottlePolicy): AttemptState {
  const fresh = !prev || now - prev.windowStart >= policy.windowMs
  const failures = fresh ? 1 : prev.failures + 1
  const windowStart = fresh ? now : prev.windowStart
  const lockedUntil = failures >= policy.maxFailures ? now + policy.lockMs : prev && !fresh ? prev.lockedUntil : null
  return { failures, windowStart, lockedUntil }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function attemptDocId(scope: LoginAttemptDoc["scope"], key: string): string {
  // Ids kept Appwrite-compatible (max 36 chars of [a-zA-Z0-9._-]) so imported rows line up.
  return createHash("sha256").update(`${scope}:${key}`).digest("hex").slice(0, 36)
}

type Bucket = { scope: LoginAttemptDoc["scope"]; key: string; policy: ThrottlePolicy }

function buckets(ip: string, email: string): Bucket[] {
  const e = normalizeEmail(email)
  return [
    { scope: "ip_email", key: `${ip}|${e}`, policy: IP_EMAIL_POLICY },
    { scope: "email", key: e, policy: EMAIL_POLICY },
  ]
}

function toState(doc: LoginAttemptDoc): AttemptState {
  return {
    failures: doc.failures,
    windowStart: new Date(doc.windowStart).getTime(),
    lockedUntil: doc.lockedUntil ? new Date(doc.lockedUntil).getTime() : null,
  }
}

async function load(id: string): Promise<LoginAttemptDoc | null> {
  try {
    return (await db.getDocument(LOGIN_ATTEMPTS_COLLECTION_ID, id)) as unknown as LoginAttemptDoc
  } catch (err) {
    if ((err as { code?: number })?.code === 404) return null
    throw err
  }
}

// Throttle storage errors are logged and fail open: a storage outage should not
// lock every member out (credential checks still apply).
export async function isLoginLocked(ip: string, email: string, now = Date.now()): Promise<boolean> {
  try {
    const docs = await Promise.all(buckets(ip, email).map((b) => load(attemptDocId(b.scope, b.key))))
    return docs.some((d) => d && isLocked(toState(d), now))
  } catch (err) {
    console.error("login throttle check failed", err)
    return false
  }
}

export async function recordLoginFailure(ip: string, email: string, now = Date.now()): Promise<void> {
  try {
    await Promise.all(
      buckets(ip, email).map(async (b) => {
        const id = attemptDocId(b.scope, b.key)
        const doc = await load(id)
        const next = recordFailureState(doc ? toState(doc) : null, now, b.policy)
        const data = {
          scope: b.scope,
          failures: next.failures,
          windowStart: new Date(next.windowStart).toISOString(),
          lockedUntil: next.lockedUntil ? new Date(next.lockedUntil).toISOString() : null,
        }
        if (doc) await db.updateDocument(LOGIN_ATTEMPTS_COLLECTION_ID, id, data)
        else
          await db.createDocument(LOGIN_ATTEMPTS_COLLECTION_ID, id, data).catch(async (err) => {
            // Lost a creation race with a concurrent attempt: update instead.
            if ((err as { code?: number })?.code !== 409) throw err
            await db.updateDocument(LOGIN_ATTEMPTS_COLLECTION_ID, id, data)
          })
      })
    )
  } catch (err) {
    console.error("login throttle record failed", err)
  }
}

// On success, clear this client's ip+email counter (the per-email counter is
// left to expire so a distributed attack can't be reset by one valid login).
export async function clearLoginFailures(ip: string, email: string): Promise<void> {
  const id = attemptDocId("ip_email", `${ip}|${normalizeEmail(email)}`)
  await db.deleteDocument(LOGIN_ATTEMPTS_COLLECTION_ID, id).catch((err) => {
    if ((err as { code?: number })?.code !== 404) console.error("login throttle clear failed", err)
  })
}

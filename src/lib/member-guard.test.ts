import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

const authMock = vi.fn()
vi.mock("@/lib/auth", () => ({ auth: () => authMock() }))

import { decideMemberAccess, requireMember } from "./member-guard"

const DAY = 24 * 60 * 60 * 1000
const future = () => new Date(Date.now() + DAY).toISOString()
const past = () => new Date(Date.now() - DAY).toISOString()

function session(user: Partial<Session["user"]>): Session {
  return {
    expires: future(),
    user: { id: "u1", role: "user", subscriptionStatus: "inactive", ...user },
  } as Session
}

describe("decideMemberAccess", () => {
  it("rejects missing sessions with 401", () => {
    const d = decideMemberAccess(null)
    expect(d).toMatchObject({ allowed: false, status: 401 })
  })

  it("rejects a session without a user id with 401", () => {
    const d = decideMemberAccess({ expires: future(), user: {} } as unknown as Session)
    expect(d).toMatchObject({ allowed: false, status: 401 })
  })

  it("allows an active subscription with a future period end", () => {
    expect(decideMemberAccess(session({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: future() }))).toEqual({ allowed: true })
  })

  it("blocks an active subscription whose period has ended with 402", () => {
    const d = decideMemberAccess(session({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: past() }))
    expect(d).toMatchObject({ allowed: false, status: 402, body: { code: "SUBSCRIPTION_REQUIRED" } })
  })

  it("allows an unexpired trial", () => {
    expect(decideMemberAccess(session({ subscriptionStatus: "trialing", trialEndsAt: future() }))).toEqual({ allowed: true })
  })

  it("blocks an expired trial with 402", () => {
    expect(decideMemberAccess(session({ subscriptionStatus: "trialing", trialEndsAt: past() }))).toMatchObject({ allowed: false, status: 402 })
  })

  it("blocks inactive users with 402", () => {
    expect(decideMemberAccess(session({ subscriptionStatus: "inactive" }))).toMatchObject({ allowed: false, status: 402 })
  })

  it("exempts admins regardless of subscription", () => {
    expect(decideMemberAccess(session({ role: "admin", subscriptionStatus: "inactive" }))).toEqual({ allowed: true })
  })
})

describe("requireMember", () => {
  beforeEach(() => authMock.mockReset())

  it("returns a 401 JSON response when signed out", async () => {
    authMock.mockResolvedValue(null)
    const r = await requireMember()
    expect(r.error?.status).toBe(401)
    expect(await r.error?.json()).toMatchObject({ error: "Unauthorized" })
  })

  it("returns a 402 JSON response with a clear error for lapsed members", async () => {
    authMock.mockResolvedValue(session({ subscriptionStatus: "trialing", trialEndsAt: past() }))
    const r = await requireMember()
    expect(r.error?.status).toBe(402)
    const body = await r.error?.json()
    expect(body.code).toBe("SUBSCRIPTION_REQUIRED")
    expect(body.error).toMatch(/subscription/i)
  })

  it("returns the session for members with access", async () => {
    const s = session({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: future() })
    authMock.mockResolvedValue(s)
    const r = await requireMember()
    expect(r.error).toBeUndefined()
    expect(r.session?.user.id).toBe("u1")
  })
})

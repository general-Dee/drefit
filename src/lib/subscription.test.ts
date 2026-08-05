import { describe, it, expect } from "vitest"
import { hasActiveAccess } from "./subscription"

const future = () => new Date(Date.now() + 60_000).toISOString()
const past = () => new Date(Date.now() - 60_000).toISOString()

describe("hasActiveAccess", () => {
  it("grants access when active with a period end in the future", () => {
    expect(hasActiveAccess("active", undefined, future())).toBe(true)
  })

  it("denies access when active but the period end has passed", () => {
    expect(hasActiveAccess("active", undefined, past())).toBe(false)
  })

  it("denies access when active but subscriptionCurrentPeriodEnd is missing", () => {
    expect(hasActiveAccess("active", undefined, undefined)).toBe(false)
  })

  it("grants access when trialing with trialEndsAt in the future", () => {
    expect(hasActiveAccess("trialing", future(), undefined)).toBe(true)
  })

  it("denies access when trialing but trialEndsAt has passed", () => {
    expect(hasActiveAccess("trialing", past(), undefined)).toBe(false)
  })

  it("denies access when trialing but trialEndsAt is missing", () => {
    expect(hasActiveAccess("trialing", undefined, undefined)).toBe(false)
  })

  it("denies access for inactive status", () => {
    expect(hasActiveAccess("inactive", future(), future())).toBe(false)
  })

  it("denies access when status is undefined", () => {
    expect(hasActiveAccess(undefined, future(), future())).toBe(false)
  })
})

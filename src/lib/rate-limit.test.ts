import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { rateLimit, getClientIp } from "./rate-limit"

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-under-${crypto.randomUUID()}`
    expect(rateLimit(key, 3, 60_000).success).toBe(true)
    expect(rateLimit(key, 3, 60_000).success).toBe(true)
    expect(rateLimit(key, 3, 60_000).success).toBe(true)
  })

  it("blocks the request that exceeds the limit", () => {
    const key = `test-over-${crypto.randomUUID()}`
    rateLimit(key, 2, 60_000)
    rateLimit(key, 2, 60_000)
    expect(rateLimit(key, 2, 60_000).success).toBe(false)
  })

  describe("with fake timers", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("resets once the window elapses", () => {
      const key = `test-reset-${crypto.randomUUID()}`
      rateLimit(key, 1, 60_000)
      expect(rateLimit(key, 1, 60_000).success).toBe(false)

      vi.advanceTimersByTime(60_001)

      expect(rateLimit(key, 1, 60_000).success).toBe(true)
    })
  })
})

describe("getClientIp", () => {
  it("reads x-forwarded-for", () => {
    const req = new Request("https://example.com", { headers: { "x-forwarded-for": "1.2.3.4" } })
    expect(getClientIp(req)).toBe("1.2.3.4")
  })

  it("takes the first entry and trims whitespace from a multi-value x-forwarded-for", () => {
    const req = new Request("https://example.com", { headers: { "x-forwarded-for": "1.2.3.4 , 5.6.7.8" } })
    expect(getClientIp(req)).toBe("1.2.3.4")
  })

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = new Request("https://example.com", { headers: { "x-real-ip": "9.8.7.6" } })
    expect(getClientIp(req)).toBe("9.8.7.6")
  })

  it("falls back to 'unknown' when neither header is present", () => {
    const req = new Request("https://example.com")
    expect(getClientIp(req)).toBe("unknown")
  })
})

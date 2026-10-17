import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { isAdminEmail, resolveRole } from "./admin"

describe("isAdminEmail", () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS

  beforeEach(() => {
    delete process.env.ADMIN_EMAILS
  })

  afterEach(() => {
    process.env.ADMIN_EMAILS = originalAdminEmails
  })

  it("matches an email in ADMIN_EMAILS", () => {
    process.env.ADMIN_EMAILS = "admin@example.com"
    expect(isAdminEmail("admin@example.com")).toBe(true)
  })

  it("matches case-insensitively", () => {
    process.env.ADMIN_EMAILS = "Admin@Example.com"
    expect(isAdminEmail("admin@example.com")).toBe(true)
  })

  it("trims whitespace around entries", () => {
    process.env.ADMIN_EMAILS = " admin@example.com , coach@example.com "
    expect(isAdminEmail("coach@example.com")).toBe(true)
  })

  it("supports multiple comma-separated emails", () => {
    process.env.ADMIN_EMAILS = "a@example.com,b@example.com,c@example.com"
    expect(isAdminEmail("b@example.com")).toBe(true)
  })

  it("returns false when ADMIN_EMAILS is empty", () => {
    process.env.ADMIN_EMAILS = ""
    expect(isAdminEmail("admin@example.com")).toBe(false)
  })

  it("returns false when ADMIN_EMAILS is unset", () => {
    expect(isAdminEmail("admin@example.com")).toBe(false)
  })

  it("returns false for a non-matching email", () => {
    process.env.ADMIN_EMAILS = "admin@example.com"
    expect(isAdminEmail("someone-else@example.com")).toBe(false)
  })
})

describe("resolveRole", () => {
  const original = process.env.ADMIN_EMAILS
  afterEach(() => {
    process.env.ADMIN_EMAILS = original
  })

  it("grants admin to the configured owner email even if stored role is user", () => {
    process.env.ADMIN_EMAILS = "oshinowodare@gmail.com"
    expect(resolveRole("oshinowodare@gmail.com", "user")).toBe("admin")
    expect(resolveRole("OshinowoDare@Gmail.com", undefined)).toBe("admin")
  })

  it("keeps a stored admin role", () => {
    process.env.ADMIN_EMAILS = ""
    expect(resolveRole("coach@example.com", "admin")).toBe("admin")
  })

  it("defaults everyone else to user", () => {
    process.env.ADMIN_EMAILS = "oshinowodare@gmail.com"
    expect(resolveRole("someone@example.com", undefined)).toBe("user")
    expect(resolveRole(null, "user")).toBe("user")
  })
})

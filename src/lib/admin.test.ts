import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { isAdminEmail } from "./admin"

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

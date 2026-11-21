import { describe, it, expect } from "vitest"
import { normalizePhone, toWhatsAppDigits } from "./phone"
import { buildCoachWhatsAppLink, buildWhatsAppShareLink } from "./whatsapp/coach-link"

describe("normalizePhone", () => {
  it.each([
    ["08031234567", "+2348031234567"],
    ["0803 123 4567", "+2348031234567"],
    ["0803-123-4567", "+2348031234567"],
    ["8031234567", "+2348031234567"],
    ["2348031234567", "+2348031234567"],
    ["+2348031234567", "+2348031234567"],
    ["+234 803 123 4567", "+2348031234567"],
    ["+234 0803 123 4567", "+2348031234567"],
    ["002348031234567", "+2348031234567"],
    ["07012345678", "+2347012345678"],
    ["09012345678", "+2349012345678"],
    ["+447911123456", "+447911123456"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it.each(["", "12345", "0603123456", "+23480312345", "+2346031234567", "abc", "+0123456789", "080312345678"])("rejects %s", (input) => {
    expect(normalizePhone(input)).toBeNull()
  })

  it("strips + for WhatsApp", () => {
    expect(toWhatsAppDigits("+2348031234567")).toBe("2348031234567")
  })
})

describe("WhatsApp links", () => {
  it("builds a wa.me coach link from a local number", () => {
    expect(buildCoachWhatsAppLink("0803 123 4567", "Hi coach")).toBe("https://wa.me/2348031234567?text=Hi%20coach")
  })
  it("returns null (button hidden) when unset or invalid", () => {
    expect(buildCoachWhatsAppLink(undefined)).toBeNull()
    expect(buildCoachWhatsAppLink("")).toBeNull()
    expect(buildCoachWhatsAppLink("not-a-number")).toBeNull()
  })
  it("builds a share link", () => {
    expect(buildWhatsAppShareLink("Join me")).toBe("https://wa.me/?text=Join%20me")
  })
})

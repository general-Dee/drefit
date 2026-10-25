import { describe, expect, it } from "vitest"
import { DEFAULT_COACH_WHATSAPP, getCoachWhatsAppNumber } from "./coach-number"
import { buildCoachWhatsAppLink } from "./coach-link"

describe("getCoachWhatsAppNumber", () => {
  it("defaults to the Aremo coach line when unset or blank", () => {
    expect(DEFAULT_COACH_WHATSAPP).toBe("+2348165510842")
    expect(getCoachWhatsAppNumber(undefined)).toBe("+2348165510842")
    expect(getCoachWhatsAppNumber("")).toBe("+2348165510842")
    expect(getCoachWhatsAppNumber("not a number")).toBe("+2348165510842")
  })
  it("uses a valid configured number", () => {
    expect(getCoachWhatsAppNumber("0803 123 4567")).toBe("+2348031234567")
  })
  it("builds a wa.me link for the default", () => {
    expect(buildCoachWhatsAppLink(getCoachWhatsAppNumber(undefined))).toBe("https://wa.me/2348165510842")
  })
})

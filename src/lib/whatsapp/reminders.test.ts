import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const db = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = "testdb"
  const docs = new Map<string, unknown>()
  return {
    docs,
    createDocument: vi.fn(async (_d: string, _c: string, id: string, data: unknown) => {
      if (docs.has(id)) throw { code: 409 }
      docs.set(id, data)
      return data
    }),
    updateDocument: vi.fn(async () => ({})),
    deleteDocument: vi.fn(async (_d: string, _c: string, id: string) => {
      docs.delete(id)
      return {}
    }),
  }
})
vi.mock("@/lib/appwrite/server", () => ({ serverDatabases: db }))

import { planReminders, paymentFailedReminder, type ReminderUser } from "./reminders"
import { sendReminderOnce, reminderLogId } from "./send"
import { getWhatsAppConfig, PENDING_CONFIG_MESSAGE } from "./config"
import { isAuthorizedCron } from "@/lib/cron-auth"

// 2026-10-17 07:30 in Lagos (UTC+1)
const NOW = new Date("2026-10-17T06:30:00Z")
const DAY = 86_400_000
const user = (over: Partial<ReminderUser> = {}): ReminderUser => ({
  $id: "u1",
  name: "Dami Oshinowo",
  phone: "+2348031234567",
  whatsappOptIn: true,
  reminderHour: 7,
  subscriptionStatus: "active",
  subscriptionCurrentPeriodEnd: new Date(NOW.getTime() + 20 * DAY).toISOString(),
  ...over,
})

const ENV = {
  WHATSAPP_TOKEN: "t",
  WHATSAPP_PHONE_NUMBER_ID: "123",
  WHATSAPP_TEMPLATE_WORKOUT_REMINDER: "workout_reminder",
  WHATSAPP_TEMPLATE_PAYMENT_DUE: "payment_due",
  WHATSAPP_TEMPLATE_PAYMENT_FAILED: "payment_failed",
} as unknown as NodeJS.ProcessEnv

describe("planReminders", () => {
  it("requires opt-in and a phone", () => {
    expect(planReminders(user({ whatsappOptIn: false }), NOW, { mode: "daily" })).toEqual([])
    expect(planReminders(user({ phone: null }), NOW, { mode: "daily" })).toEqual([])
  })

  it("hourly mode only fires at the user's chosen Lagos hour", () => {
    expect(planReminders(user({ reminderHour: 7 }), NOW, { mode: "hourly" })).toHaveLength(1)
    expect(planReminders(user({ reminderHour: 8 }), NOW, { mode: "hourly" })).toHaveLength(0)
  })

  it("daily mode sends regardless of hour", () => {
    expect(planReminders(user({ reminderHour: 20 }), NOW, { mode: "daily" })[0].type).toBe("workout_reminder")
  })

  it("skips the workout reminder if already trained today", () => {
    expect(planReminders(user(), NOW, { mode: "daily", completedToday: true })).toEqual([])
  })

  it("uses the planned workout name and first name", () => {
    const [r] = planReminders(user(), NOW, { mode: "daily", workoutName: "Core Crusher" })
    expect(r.params).toEqual(["Dami", "Core Crusher"])
    expect(r.day).toBe("2026-10-17")
  })

  it.each([
    [3, true],
    [1, true],
    [2, false],
    [5, false],
  ])("payment reminder %i day(s) before subscription end: %s", (days, expected) => {
    const end = new Date("2026-10-17T12:00:00Z").getTime() + days * DAY
    const rs = planReminders(user({ subscriptionCurrentPeriodEnd: new Date(end).toISOString() }), NOW, { mode: "daily", completedToday: true })
    expect(rs.some((r) => r.dedupeType === `payment_due_${days}`)).toBe(expected)
  })

  it("payment reminders also cover trials", () => {
    const rs = planReminders(
      user({ subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: null, trialEndsAt: "2026-10-18T10:00:00Z" }),
      NOW,
      { mode: "daily", completedToday: true }
    )
    expect(rs).toHaveLength(1)
    expect(rs[0].params).toEqual(["Dami", "1", "2026-10-18", "free trial"])
  })

  it("payment failed reminder respects opt-in", () => {
    expect(paymentFailedReminder(user(), NOW)?.type).toBe("payment_failed")
    expect(paymentFailedReminder(user({ whatsappOptIn: false }), NOW)).toBeNull()
  })
})

describe("sendReminderOnce", () => {
  const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }))
  beforeEach(() => {
    db.docs.clear()
    fetchImpl.mockClear()
  })
  afterEach(() => vi.restoreAllMocks())

  it("never sends and logs the pending message when WhatsApp env is unset", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    const [r] = planReminders(user(), NOW, { mode: "daily" })
    expect(await sendReminderOnce(user(), r, { env: {} as NodeJS.ProcessEnv, fetchImpl })).toBe("pending_config")
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(db.createDocument).not.toHaveBeenCalled()
    expect(log.mock.calls[0][0]).toContain(PENDING_CONFIG_MESSAGE)
  })

  it("the default test env has no WhatsApp config (nothing auto-sends in tests)", () => {
    expect(getWhatsAppConfig()).toBeNull()
  })

  it("sends a template via the Cloud API once per user/type/day", async () => {
    const [r] = planReminders(user(), NOW, { mode: "daily", workoutName: "Leg Day" })
    expect(await sendReminderOnce(user(), r, { env: ENV, fetchImpl })).toBe("sent")
    expect(await sendReminderOnce(user(), r, { env: ENV, fetchImpl })).toBe("duplicate")
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("https://graph.facebook.com/v21.0/123/messages")
    const body = JSON.parse(init.body as string)
    expect(body).toMatchObject({ to: "2348031234567", type: "template", template: { name: "workout_reminder" } })
    expect(body.template.components[0].parameters.map((p: { text: string }) => p.text)).toEqual(["Dami", "Leg Day"])
  })

  it("dedupe ids differ per type and day", () => {
    expect(reminderLogId("u1", "workout_reminder", "2026-10-17")).not.toBe(reminderLogId("u1", "workout_reminder", "2026-10-18"))
    expect(reminderLogId("u1", "payment_due_3", "2026-10-17")).not.toBe(reminderLogId("u1", "payment_due_1", "2026-10-17"))
  })

  it("releases the dedupe claim when sending fails so a later run can retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const failing = vi.fn(async () => new Response("bad", { status: 500 }))
    const [r] = planReminders(user(), NOW, { mode: "daily" })
    expect(await sendReminderOnce(user(), r, { env: ENV, fetchImpl: failing })).toBe("failed")
    expect(db.docs.size).toBe(0)
    expect(await sendReminderOnce(user(), r, { env: ENV, fetchImpl })).toBe("sent")
  })
})

describe("isAuthorizedCron", () => {
  it("requires the exact bearer secret", () => {
    expect(isAuthorizedCron("Bearer s3cret", "s3cret")).toBe(true)
    expect(isAuthorizedCron("Bearer wrong", "s3cret")).toBe(false)
    expect(isAuthorizedCron(null, "s3cret")).toBe(false)
    expect(isAuthorizedCron("Bearer ", undefined)).toBe(false)
  })
})

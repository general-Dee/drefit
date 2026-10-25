import { createHash } from "crypto"
import { db as serverDb } from "@/lib/db/client"
import { REMINDER_LOG_COLLECTION_ID } from "@/lib/db/schema"
import { toWhatsAppDigits } from "@/lib/phone"
import { getWhatsAppConfig, PENDING_CONFIG_MESSAGE, type ReminderType, type WhatsAppConfig } from "./config"
import type { PlannedReminder } from "./reminders"

export type SendResult = "sent" | "duplicate" | "pending_config" | "failed"

type FetchLike = (url: string, init: RequestInit) => Promise<Response>

export function reminderLogId(userId: string, dedupeType: string, day: string): string {
  return createHash("sha256").update(`${userId}|${dedupeType}|${day}`).digest("hex").slice(0, 36)
}

export async function sendTemplateMessage(
  cfg: WhatsAppConfig,
  toE164: string,
  type: ReminderType,
  params: string[],
  fetchImpl: FetchLike = fetch
): Promise<void> {
  const res = await fetchImpl(`https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toWhatsAppDigits(toE164),
      type: "template",
      template: {
        name: cfg.templates[type],
        language: { code: cfg.language },
        components: params.length ? [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }] : [],
      },
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`WhatsApp API ${res.status}: ${body.slice(0, 300)}`)
  }
}

// Sends one planned reminder at most once per (user, type, Lagos day).
// With WhatsApp env unset nothing is sent or recorded.
export async function sendReminderOnce(
  user: { $id: string; phone?: string | null },
  reminder: PlannedReminder,
  deps: { env?: NodeJS.ProcessEnv; fetchImpl?: FetchLike; db?: typeof serverDb } = {}
): Promise<SendResult> {
  const cfg = getWhatsAppConfig(deps.env ?? process.env)
  if (!cfg) {
    console.log(`${PENDING_CONFIG_MESSAGE} (skipped ${reminder.dedupeType} for user ${user.$id})`)
    return "pending_config"
  }
  if (!user.phone) return "failed"
  const db = deps.db ?? serverDb
  const id = reminderLogId(user.$id, reminder.dedupeType, reminder.day)
  try {
    await db.createDocument(REMINDER_LOG_COLLECTION_ID, id, {
      userId: user.$id,
      type: reminder.dedupeType,
      day: reminder.day,
      status: "sending",
      createdAt: new Date().toISOString(),
    })
  } catch (err) {
    if ((err as { code?: number })?.code === 409) return "duplicate"
    throw err
  }
  try {
    await sendTemplateMessage(cfg, user.phone, reminder.type, reminder.params, deps.fetchImpl)
    await db.updateDocument(REMINDER_LOG_COLLECTION_ID, id, { status: "sent" }).catch(() => {})
    return "sent"
  } catch (err) {
    console.error(`whatsapp send failed for ${user.$id} ${reminder.dedupeType}`, err)
    // Release the claim so a later run can retry today.
    await db.deleteDocument(REMINDER_LOG_COLLECTION_ID, id).catch(() => {})
    return "failed"
  }
}

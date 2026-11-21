export type ReminderType = "workout_reminder" | "payment_due" | "payment_failed"

export interface WhatsAppConfig {
  token: string
  phoneNumberId: string
  apiVersion: string
  language: string
  templates: Record<ReminderType, string>
}

// All of WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID and the three approved
// template names must be set, otherwise nothing is sent.
export function getWhatsAppConfig(env: NodeJS.ProcessEnv = process.env): WhatsAppConfig | null {
  const token = env.WHATSAPP_TOKEN
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID
  const templates = {
    workout_reminder: env.WHATSAPP_TEMPLATE_WORKOUT_REMINDER,
    payment_due: env.WHATSAPP_TEMPLATE_PAYMENT_DUE,
    payment_failed: env.WHATSAPP_TEMPLATE_PAYMENT_FAILED,
  }
  if (!token || !phoneNumberId || Object.values(templates).some((t) => !t)) return null
  return {
    token,
    phoneNumberId,
    apiVersion: env.WHATSAPP_API_VERSION || "v21.0",
    language: env.WHATSAPP_TEMPLATE_LANG || "en",
    templates: templates as Record<ReminderType, string>,
  }
}

export const PENDING_CONFIG_MESSAGE = "WhatsApp sending pending configuration"

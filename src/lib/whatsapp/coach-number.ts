import { normalizePhone } from "@/lib/phone"

// Damilare's coaching WhatsApp line (+234 816 551 0842). Used whenever
// NEXT_PUBLIC_COACH_WHATSAPP is unset or invalid so the coach button always shows.
export const DEFAULT_COACH_WHATSAPP = "+2348165510842"

export function getCoachWhatsAppNumber(raw: string | undefined | null): string {
  return normalizePhone(raw ?? "") ?? DEFAULT_COACH_WHATSAPP
}

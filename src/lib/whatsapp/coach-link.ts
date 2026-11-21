import { normalizePhone, toWhatsAppDigits } from "@/lib/phone"

// Builds a wa.me deep link to the coach. Returns null when the number is
// missing or invalid so the UI can hide the button.
export function buildCoachWhatsAppLink(rawNumber: string | undefined | null, text?: string): string | null {
  const phone = normalizePhone(rawNumber ?? "")
  if (!phone) return null
  const base = `https://wa.me/${toWhatsAppDigits(phone)}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

// Generic share link (no recipient), used for referral sharing.
export function buildWhatsAppShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

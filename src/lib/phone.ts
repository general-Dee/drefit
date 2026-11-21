// Phone normalisation to E.164. Nigerian numbers are accepted in the common
// local formats (0803…, 803…, 234803…, +234 803 …) and normalised to
// +234XXXXXXXXXX. Other countries must already be in +<country><number> form.

const E164 = /^\+[1-9]\d{7,14}$/
// Nigerian mobile numbers: +234 followed by 10 digits starting 7, 8 or 9.
const NG_MOBILE = /^\+234[789]\d{9}$/

export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  const hasPlus = trimmed.startsWith("+")
  let digits = trimmed.replace(/[\s\-().]/g, "").replace(/^\+/, "")
  if (!/^\d+$/.test(digits)) return null
  if (digits.startsWith("00")) digits = digits.slice(2) // 00234… international prefix

  // Nigerian forms
  if (!hasPlus || digits.startsWith("234")) {
    if (digits.startsWith("2340")) digits = "234" + digits.slice(4) // +234 0803…
    if (digits.startsWith("234")) {
      const ng = `+${digits}`
      return NG_MOBILE.test(ng) ? ng : null
    }
    if (!hasPlus) {
      if (/^0[789]\d{9}$/.test(digits)) return `+234${digits.slice(1)}`
      if (/^[789]\d{9}$/.test(digits)) return `+234${digits}`
      return null
    }
  }

  const e164 = `+${digits}`
  return E164.test(e164) ? e164 : null
}

// wa.me / Cloud API want digits only, no "+".
export function toWhatsAppDigits(e164: string): string {
  return e164.replace(/^\+/, "")
}

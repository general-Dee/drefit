// Safety net: tests must never reach real external services (WhatsApp Cloud
// API, Paystack). Any un-mocked network call fails loudly.
const realFetch = globalThis.fetch
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
  if (/graph\.facebook\.com|api\.paystack\.co/.test(url)) {
    throw new Error(`Blocked network call in tests: ${url}`)
  }
  return realFetch(input, init)
}) as typeof fetch
for (const k of Object.keys(process.env)) if (k.startsWith("WHATSAPP_")) delete process.env[k]

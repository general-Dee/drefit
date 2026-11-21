import { NextRequest, NextResponse } from "next/server"
import {
  applyVerifiedCharge,
  fetchVerifiedTransaction,
  isValidReference,
  verifyPaystackSignature,
  type PaystackTransaction,
} from "@/lib/paystack/charge"
import { notifyPaymentFailed } from "@/lib/whatsapp/payment-failed"

export async function POST(req: NextRequest) {
  // 1. Verify the HMAC-SHA512 signature over the raw body (constant-time).
  const rawBody = await req.text()
  if (!verifyPaystackSignature(rawBody, req.headers.get("x-paystack-signature"), process.env.PAYSTACK_SECRET_KEY)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: { event?: string; data?: { reference?: unknown; status?: string } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  // Failed charges never grant access; optionally nudge the member on WhatsApp.
  if (event.event === "charge.failed" || event.event === "invoice.payment_failed") {
    await notifyPaymentFailed(event.data as unknown as PaystackTransaction)
    return NextResponse.json({ received: true, ignored: true })
  }

  // 2. Only successful charges can grant access; acknowledge everything else.
  if (event.event !== "charge.success" || event.data?.status !== "success") {
    return NextResponse.json({ received: true, ignored: true })
  }
  const reference = event.data?.reference
  if (!isValidReference(reference)) {
    console.warn("paystack webhook: invalid reference")
    return NextResponse.json({ received: true, ignored: true })
  }

  try {
    // 3. Re-confirm with Paystack and use its authoritative data (amount,
    //    currency, status, customer) rather than the webhook payload alone.
    const tx = await fetchVerifiedTransaction(reference)
    const result = await applyVerifiedCharge(tx, "webhook")
    if (result.status === "rejected" || result.status === "user_not_found") {
      console.warn(`paystack webhook: ${reference} not applied (${result.status}${"reason" in result ? `: ${result.reason}` : ""})`)
    } else {
      console.log(`paystack webhook: ${reference} ${result.status}`)
    }
    // 4. Paystack requires a 200 to stop retrying.
    return NextResponse.json({ received: true, status: result.status })
  } catch (error) {
    // Transient failure (Paystack/Appwrite): return 500 so Paystack retries.
    console.error("paystack webhook error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

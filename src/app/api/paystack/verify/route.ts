import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { applyVerifiedCharge, fetchVerifiedTransaction, isValidReference } from "@/lib/paystack/charge"

// Client-callback path: after checkout the browser sends the reference here.
// Access is only granted after confirming the transaction with Paystack's
// verify API, checking status/amount/currency, and that it belongs to the
// signed-in user. Idempotent with the webhook (same reference is applied once).
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const reference = body?.reference
  if (!isValidReference(reference)) {
    return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 })
  }

  try {
    const tx = await fetchVerifiedTransaction(reference)
    const result = await applyVerifiedCharge(tx, "verify", { expectedUserId: session.user.id })
    switch (result.status) {
      case "activated":
        return NextResponse.json({ success: true, status: "activated", periodEnd: result.periodEnd })
      case "duplicate":
        return NextResponse.json({ success: true, status: "already_processed" })
      case "rejected":
        return NextResponse.json(
          { error: "This payment was not successful or doesn't match the plan, so no access was granted.", code: "PAYMENT_NOT_VALID" },
          { status: 402 }
        )
      case "user_not_found":
        return NextResponse.json({ error: "Payment could not be matched to your account." }, { status: 403 })
    }
  } catch (error) {
    console.error("paystack verify error", error)
    return NextResponse.json({ error: "Could not verify payment. Please try again shortly." }, { status: 502 })
  }
}

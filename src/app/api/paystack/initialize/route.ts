import { NextRequest, NextResponse } from "next/server"
import { appOrigin } from "@/lib/app-url"
import { auth } from "@/lib/auth"
import { PLAN_AMOUNT_KOBO, PLAN_CURRENCY } from "@/lib/paystack/plan"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    cache: "no-store", // never reuse a cached Paystack session from Next's data cache
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: session.user.email,
      amount: PLAN_AMOUNT_KOBO,
      currency: PLAN_CURRENCY,
      // Redirect-flow fallback: /subscription verifies ?reference= server-side.
      callback_url: `${appOrigin(req)}/subscription`,
      // Lets the webhook/verify path match the payer to the account reliably.
      metadata: { userId: session.user.id },
    }),
  })

  const data = await response.json()

  if (!response.ok || !data.status) {
    return NextResponse.json({ error: data.message || "Failed to initialize transaction" }, { status: 502 })
  }

  return NextResponse.json({ access_code: data.data.access_code, reference: data.data.reference })
}

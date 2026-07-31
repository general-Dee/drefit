import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Query } from "node-appwrite";
import { serverDatabases } from "@/lib/appwrite/server";
import { DATABASE_ID, USERS_COLLECTION_ID } from "@/lib/appwrite/schema";
import { PLAN_PERIOD_DAYS } from "@/lib/paystack/plan";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Paystack signature (security)
    const signature = req.headers.get("x-paystack-signature");
    const rawBody = await req.text();

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY!;
    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Parse the event
    const event = JSON.parse(rawBody);
    const { event: eventType, data } = event;

    // 3. Handle successful charge
    if (eventType === "charge.success") {
      const email = data.customer.email;
      const subscriptionId = data.reference; // Paystack transaction reference

      // 4. Find user in Appwrite by email
      const users = await serverDatabases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal("email", email)]
      );

      if (users.documents.length === 0) {
        console.error(`User not found: ${email}`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const userId = users.documents[0].$id;

      // Base the period on the charge's own timestamp, not the time the
      // webhook happens to be delivered/retried.
      const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();
      const subscriptionCurrentPeriodEnd = new Date(
        paidAt.getTime() + PLAN_PERIOD_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();

      // 5. Update subscription status
      await serverDatabases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId,
        {
          subscriptionStatus: "active",
          subscriptionId: subscriptionId,
          subscriptionCurrentPeriodEnd,
        }
      );

      console.log(`Subscription activated for ${email}`);
    }

    // 6. Acknowledge receipt (Paystack requires a 200 OK)
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

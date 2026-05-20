import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { serverDatabases } from "@/lib/appwrite/server"; // we'll create this

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
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        "users",
        [ `email=${email}` ]
      );

      if (users.documents.length === 0) {
        console.error(`User not found: ${email}`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const userId = users.documents[0].$id;

      // 5. Update subscription status
      await serverDatabases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        "users",
        userId,
        {
          subscriptionStatus: "active",
          subscriptionId: subscriptionId,
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
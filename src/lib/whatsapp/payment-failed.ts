import type { AppwriteUserDoc } from "@/lib/appwrite/schema"
import { findUser, type PaystackTransaction } from "@/lib/paystack/charge"
import { paymentFailedReminder } from "./reminders"
import { sendReminderOnce } from "./send"

// Best-effort "payment failed" WhatsApp nudge (opted-in users only, once per
// day). Never throws: it must not affect payment handling.
export async function notifyPaymentFailed(tx: PaystackTransaction, expectedUserId?: string): Promise<void> {
  try {
    const user = (await findUser(tx)) as AppwriteUserDoc | null
    if (!user || (expectedUserId && user.$id !== expectedUserId)) return
    const reminder = paymentFailedReminder(user, new Date())
    if (reminder) await sendReminderOnce(user, reminder)
  } catch (err) {
    console.error("payment-failed notification error", err)
  }
}

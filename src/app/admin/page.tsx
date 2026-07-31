import { Users, DollarSign, Dumbbell } from "lucide-react"
import { Query } from "node-appwrite"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, USERS_COLLECTION_ID } from "@/lib/appwrite/schema"
import { PLAN_PRICE_NGN } from "@/lib/paystack/plan"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const [totalUsers, activeSubscribers] = await Promise.all([
    serverDatabases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [Query.limit(1)]),
    serverDatabases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
      Query.equal("subscriptionStatus", "active"),
      Query.limit(1),
    ]),
  ])

  // Current active-subscriber count x price, not true recurring MRR (no proration/tiers).
  const mrr = activeSubscribers.total * PLAN_PRICE_NGN

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl">Admin Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card p-4"><Users className="text-drefit-lime"/> Total Users: {totalUsers.total.toLocaleString()}</div>
        <div className="glass-card p-4"><DollarSign className="text-drefit-lime"/> MRR: ₦{mrr.toLocaleString()}</div>
        <div className="glass-card p-4"><Dumbbell className="text-drefit-lime"/> Workouts: — (not tracked yet)</div>
      </div>
      <div className="glass-card p-4 opacity-60">
        <h2 className="text-xl mb-2">Create Workout (coming soon)</h2>
        <p className="text-sm text-gray-400">Workout management isn&apos;t implemented yet — no workouts collection exists.</p>
      </div>
    </div>
  )
}

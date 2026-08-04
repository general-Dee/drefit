import Link from "next/link"
import { Users, DollarSign, Dumbbell, ChevronRight } from "lucide-react"
import { Query } from "node-appwrite"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, USERS_COLLECTION_ID, WORKOUTS_COLLECTION_ID, DIET_PLANS_COLLECTION_ID } from "@/lib/appwrite/schema"
import { PLAN_PRICE_NGN } from "@/lib/paystack/plan"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const [totalUsers, activeSubscribers, totalWorkouts, totalDietPlans] = await Promise.all([
    serverDatabases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [Query.limit(1)]),
    serverDatabases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
      Query.equal("subscriptionStatus", "active"),
      Query.limit(1),
    ]),
    serverDatabases.listDocuments(DATABASE_ID, WORKOUTS_COLLECTION_ID, [Query.limit(1)]),
    serverDatabases.listDocuments(DATABASE_ID, DIET_PLANS_COLLECTION_ID, [Query.limit(1)]),
  ])

  // Current active-subscriber count x price, not true recurring MRR (no proration/tiers).
  const mrr = activeSubscribers.total * PLAN_PRICE_NGN

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl">Admin Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card p-4"><Users className="text-drefit-lime"/> Total Users: {totalUsers.total.toLocaleString()}</div>
        <div className="glass-card p-4"><DollarSign className="text-drefit-lime"/> MRR: ₦{mrr.toLocaleString()}</div>
        <div className="glass-card p-4"><Dumbbell className="text-drefit-lime"/> Workouts in library: {totalWorkouts.total.toLocaleString()}</div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/admin/workouts"
          className="glass-card p-4 flex items-center justify-between hover:border-drefit-lime/40 transition-colors"
        >
          <div>
            <h2 className="text-xl mb-1">Manage Workouts</h2>
            <p className="text-sm text-gray-400">{totalWorkouts.total.toLocaleString()} in library</p>
          </div>
          <ChevronRight className="text-drefit-lime" />
        </Link>
        <Link
          href="/admin/diet"
          className="glass-card p-4 flex items-center justify-between hover:border-drefit-lime/40 transition-colors"
        >
          <div>
            <h2 className="text-xl mb-1">Manage Diet Plans</h2>
            <p className="text-sm text-gray-400">{totalDietPlans.total.toLocaleString()} plan days</p>
          </div>
          <ChevronRight className="text-drefit-lime" />
        </Link>
        <Link
          href="/admin/coaching"
          className="glass-card p-4 flex items-center justify-between hover:border-drefit-lime/40 transition-colors"
        >
          <div>
            <h2 className="text-xl mb-1">Coaching Messages</h2>
            <p className="text-sm text-gray-400">Reply to member conversations</p>
          </div>
          <ChevronRight className="text-drefit-lime" />
        </Link>
      </div>
    </div>
  )
}

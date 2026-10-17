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
    <div className="page-shell space-y-6">
      <h1 className="fade-up font-bold">Admin Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card p-4"><div className="flex items-center gap-2 text-xs font-medium text-ink-muted"><span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent"><Users className="h-4 w-4"/></span>Total users</div><div className="stat-value mt-3">{totalUsers.total.toLocaleString()}</div></div>
        <div className="glass-card p-4"><div className="flex items-center gap-2 text-xs font-medium text-ink-muted"><span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent"><DollarSign className="h-4 w-4"/></span>MRR</div><div className="stat-value mt-3">₦{mrr.toLocaleString()}</div></div>
        <div className="glass-card p-4"><div className="flex items-center gap-2 text-xs font-medium text-ink-muted"><span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent"><Dumbbell className="h-4 w-4"/></span>Workouts in library</div><div className="stat-value mt-3">{totalWorkouts.total.toLocaleString()}</div></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/admin/workouts"
          className="glass-card card-interactive p-4 flex items-center justify-between"
        >
          <div>
            <h2 className="text-xl mb-1">Manage Workouts</h2>
            <p className="text-sm text-ink-muted">{totalWorkouts.total.toLocaleString()} in library</p>
          </div>
          <ChevronRight className="text-drefit-lime" />
        </Link>
        <Link
          href="/admin/diet"
          className="glass-card card-interactive p-4 flex items-center justify-between"
        >
          <div>
            <h2 className="text-xl mb-1">Manage Diet Plans</h2>
            <p className="text-sm text-ink-muted">{totalDietPlans.total.toLocaleString()} plan days</p>
          </div>
          <ChevronRight className="text-drefit-lime" />
        </Link>
        <Link
          href="/admin/coaching"
          className="glass-card card-interactive p-4 flex items-center justify-between"
        >
          <div>
            <h2 className="text-xl mb-1">Coaching Messages</h2>
            <p className="text-sm text-ink-muted">Reply to member conversations</p>
          </div>
          <ChevronRight className="text-drefit-lime" />
        </Link>
      </div>
    </div>
  )
}

import Link from "next/link"
import { Users, Wallet, Dumbbell, ChevronRight, Salad, MessagesSquare } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import StatCard from "@/components/ui/StatCard"
import CountUp from "@/components/ui/CountUp"
import { Query } from "@/lib/db/query"
import { db } from "@/lib/db/client"
import { USERS_COLLECTION_ID, WORKOUTS_COLLECTION_ID, DIET_PLANS_COLLECTION_ID } from "@/lib/db/schema"
import { PLAN_PRICE_NGN } from "@/lib/paystack/plan"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const [totalUsers, activeSubscribers, totalWorkouts, totalDietPlans] = await Promise.all([
    db.listDocuments(USERS_COLLECTION_ID, [Query.limit(1)]),
    db.listDocuments(USERS_COLLECTION_ID, [
      Query.equal("subscriptionStatus", "active"),
      Query.limit(1),
    ]),
    db.listDocuments(WORKOUTS_COLLECTION_ID, [Query.limit(1)]),
    db.listDocuments(DIET_PLANS_COLLECTION_ID, [Query.limit(1)]),
  ])

  // Current active-subscriber count x price, not true recurring MRR (no proration/tiers).
  const mrr = activeSubscribers.total * PLAN_PRICE_NGN

  const tiles = [
    { href: "/admin/workouts", icon: Dumbbell, title: "Manage workouts", sub: `${totalWorkouts.total.toLocaleString()} in library` },
    { href: "/admin/diet", icon: Salad, title: "Manage diet plans", sub: `${totalDietPlans.total.toLocaleString()} plan days` },
    { href: "/admin/coaching", icon: MessagesSquare, title: "Coaching messages", sub: "Reply to member conversations" },
  ]

  return (
    <div className="page-shell">
      <PageHeader eyebrow="Admin" title="Coach console" subtitle="Members, revenue and your content library at a glance." />
      <div className="stagger grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <StatCard icon={Users} label="Total users"><CountUp value={totalUsers.total} /></StatCard>
        <StatCard icon={Wallet} label="Monthly revenue" hint={`${activeSubscribers.total.toLocaleString()} active × ₦${PLAN_PRICE_NGN.toLocaleString()}`}>
          <CountUp value={mrr} prefix="₦" />
        </StatCard>
        <StatCard icon={Dumbbell} label="Workouts in library"><CountUp value={totalWorkouts.total} /></StatCard>
      </div>
      <h2 className="label-caps mb-3 mt-8">Manage</h2>
      <div className="stagger grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="group glass-card card-interactive flex items-center gap-4 p-4 sm:p-5">
            <span className="icon-tile h-11 w-11"><t.icon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate">{t.title}</h3>
              <p className="truncate text-sm text-ink-muted">{t.sub}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-ink-subtle transition-transform duration-base ease-out group-hover:translate-x-0.5 group-hover:text-accent" />
          </Link>
        ))}
      </div>
    </div>
  )
}

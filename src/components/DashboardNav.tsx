"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Dumbbell, Apple, TrendingUp, Users, MessageCircle, Settings, Shield, LogOut, Gift } from "lucide-react"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/dashboard/diet", label: "Diet", icon: Apple },
  { href: "/dashboard/progress", label: "Progress", icon: TrendingUp },
  { href: "/dashboard/community", label: "Community", icon: Users },
  { href: "/dashboard/coaching", label: "Coaching", icon: MessageCircle },
  { href: "/dashboard/referrals", label: "Invite", icon: Gift },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export default function DashboardNav({ role }: { role?: string }) {
  const pathname = usePathname()

  return (
    <nav className="border-b border-white/10 bg-drefit-dark/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const active = link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-4 text-sm whitespace-nowrap border-b-2 transition ${
                  active
                    ? "border-drefit-lime text-drefit-lime"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <link.icon className="w-4 h-4" /> {link.label}
              </Link>
            )
          })}
          {role === "admin" && (
            <Link
              href="/admin"
              className={`flex items-center gap-2 px-3 py-4 text-sm whitespace-nowrap border-b-2 transition ${
                pathname.startsWith("/admin")
                  ? "border-drefit-lime text-drefit-lime"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4" /> Admin
            </Link>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </nav>
  )
}

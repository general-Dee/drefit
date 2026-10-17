"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { flushQueue, postCompletion, writeQueue } from "@/lib/offline-queue"
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

// Before signing out: try to sync offline completions, then clear the
// local queue and cached member data so the next user on this device can't
// see or inherit them.
async function handleSignOut() {
  try {
    if (navigator.onLine) await flushQueue(window.localStorage, postCompletion)
    writeQueue(window.localStorage, [])
    navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_USER_CACHES" })
    if ("caches" in window) {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k.startsWith("drefit-data-") || k.startsWith("drefit-pages-")).map((k) => caches.delete(k)))
    }
  } catch {
    // never block sign-out
  }
  await signOut({ callbackUrl: "/login" })
}

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
          onClick={() => handleSignOut()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </nav>
  )
}

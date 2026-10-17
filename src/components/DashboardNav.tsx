"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { flushQueue, postCompletion, writeQueue } from "@/lib/offline-queue"
import Logo from "@/components/ui/Logo"
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

const mobileTabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/workouts", label: "Train", icon: Dumbbell },
  { href: "/dashboard/progress", label: "Progress", icon: TrendingUp },
  { href: "/dashboard/coaching", label: "Coach", icon: MessageCircle },
  { href: "/dashboard/settings", label: "Me", icon: Settings },
]

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href)
}

export default function DashboardNav({ role }: { role?: string }) {
  const pathname = usePathname()

  return (
    <>
      {/* Top bar: full nav on desktop, logo + shortcuts on mobile */}
      <nav className="sticky top-0 z-30 border-b border-white/[0.06] bg-surface-0/70 backdrop-blur-xl supports-[not(backdrop-filter:blur(1px))]:bg-surface-0">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <Logo href="/dashboard" />
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = isActive(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                    active ? "bg-white/[0.06] text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <link.icon className={`h-4 w-4 ${active ? "text-accent" : ""}`} /> {link.label}
                </Link>
              )
            })}
            {role === "admin" && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  pathname.startsWith("/admin") ? "bg-white/[0.06] text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                <Shield className="h-4 w-4" /> Admin
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Link href="/dashboard/referrals" className="btn-ghost md:hidden" aria-label="Invite friends">
              <Gift className="h-4 w-4" />
            </Link>
            {role === "admin" && (
              <Link href="/admin" className="btn-ghost md:hidden" aria-label="Admin">
                <Shield className="h-4 w-4" />
              </Link>
            )}
            <button onClick={() => handleSignOut()} className="btn-ghost" aria-label="Sign out">
              <LogOut className="h-4 w-4" /> <span className="hidden lg:inline">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-surface-0/80 backdrop-blur-xl supports-[not(backdrop-filter:blur(1px))]:bg-surface-0 safe-bottom md:hidden" aria-label="Primary">
        <div className="grid grid-cols-5">
          {mobileTabs.map((tab) => {
            const active = isActive(pathname, tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-transform active:scale-95 ${active ? "text-accent" : "text-ink-muted"}`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

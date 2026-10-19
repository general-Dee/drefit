"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { flushQueue, postCompletion, writeQueue } from "@/lib/offline-queue"
import Logo from "@/components/ui/Logo"
import { motion } from "framer-motion"
import { SPRING } from "@/components/ui/motion"
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

function DesktopLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-base ${
        active ? "text-ink" : "text-ink-muted hover:bg-white/[0.04] hover:text-ink"
      }`}
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 -z-10 rounded-lg bg-white/[0.07] ring-1 ring-inset ring-white/[0.06]"
          transition={SPRING}
        />
      )}
      <Icon className={`h-4 w-4 ${active ? "text-accent" : ""}`} />
      {label}
    </Link>
  )
}

export default function DashboardNav({ role }: { role?: string }) {
  const pathname = usePathname()

  return (
    <>
      {/* Top bar: full nav on desktop (the only blurred bar), logo + shortcuts below lg */}
      <nav className="bar sticky top-0 z-30 border-b lg:bar-blur" aria-label="Main">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo href="/dashboard" />
          <div className="relative isolate hidden items-center gap-0.5 lg:flex">
            {links.map((link) => (
              <DesktopLink key={link.href} {...link} active={isActive(pathname, link.href)} />
            ))}
            {role === "admin" && <DesktopLink href="/admin" label="Admin" icon={Shield} active={pathname.startsWith("/admin")} />}
          </div>
          <div className="flex items-center gap-1">
            <Link href="/dashboard/referrals" className="icon-btn lg:hidden" aria-label="Invite friends" title="Invite friends">
              <Gift className="h-5 w-5" />
            </Link>
            {role === "admin" && (
              <Link href="/admin" className="icon-btn lg:hidden" aria-label="Admin" title="Admin">
                <Shield className="h-5 w-5" />
              </Link>
            )}
            <button onClick={() => handleSignOut()} className="icon-btn" aria-label="Sign out" title="Sign out">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile/tablet bottom tab bar: solid surface (no second blur layer) */}
      <nav className="bar fixed inset-x-0 bottom-0 z-30 border-t safe-bottom lg:hidden" aria-label="Primary">
        <div className="relative isolate mx-auto grid max-w-lg grid-cols-5">
          {mobileTabs.map((tab) => {
            const active = isActive(pathname, tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`pressable relative flex flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-medium tracking-[0.01em] transition-colors duration-base ${active ? "text-accent" : "text-ink-muted hover:text-ink"}`}
              >
                {active && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute inset-x-0 top-0 mx-auto h-[2px] w-8 rounded-full bg-accent shadow-[0_0_12px_rgba(200,241,53,0.8)]"
                    transition={SPRING}
                  />
                )}
                <tab.icon className="h-[22px] w-[22px]" />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

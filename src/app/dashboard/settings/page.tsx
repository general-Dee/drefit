"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, Bell, CalendarClock, Clock, User, CreditCard, MessageCircle, Phone, type LucideIcon } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import Spinner from "@/components/ui/Spinner"
import { reveal } from "@/components/ui/motion"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { PLAN_PRICE_NGN } from "@/lib/paystack/plan"

export const dynamic = "force-dynamic"

export default function SettingsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [name, setName] = useState("")
  const [notifications, setNotifications] = useState(true)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [phone, setPhone] = useState("")
  const [whatsappOptIn, setWhatsappOptIn] = useState(false)
  const [reminderHour, setReminderHour] = useState(7)
  const [savingReminders, setSavingReminders] = useState(false)

  useEffect(() => {
    fetch("/api/settings/reminders")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        setPhone(data.phone ?? "")
        setWhatsappOptIn(!!data.whatsappOptIn)
        setReminderHour(data.reminderHour ?? 7)
      })
      .catch(() => {})
  }, [])

  const handleSaveReminders = async () => {
    setSavingReminders(true)
    try {
      const res = await fetch("/api/settings/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, whatsappOptIn, reminderHour }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not save reminder settings")
        return
      }
      if (data.phone) setPhone(data.phone)
      toast.success("Reminder settings saved")
    } finally {
      setSavingReminders(false)
    }
  }

  useEffect(() => {
    fetch("/api/settings/profile")
      .then((res) => res.json())
      .then((data) => {
        setName(data.name ?? "")
        setNotifications(data.notificationsEnabled ?? true)
      })
      .finally(() => setLoadingProfile(false))
  }, [])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not save profile")
        return
      }
      toast.success("Profile updated")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleToggleNotifications = async () => {
    const next = !notifications
    setNotifications(next)
    const res = await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationsEnabled: next }),
    })
    if (!res.ok) {
      setNotifications(!next)
      toast.error("Could not update notification preference")
    }
  }

  const handleCancelSubscription = async () => {
    setCancelling(true)
    try {
      const res = await fetch("/api/settings/cancel-subscription", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not cancel subscription")
        return
      }
      toast.success("Subscription cancelled")
      router.push("/subscription")
    } finally {
      setCancelling(false)
    }
  }

  const periodEnd = session?.user?.subscriptionCurrentPeriodEnd
  const status = session?.user?.subscriptionStatus

  return (
    <div className="page-shell max-w-2xl">
      <PageHeader eyebrow="Account" title="Settings" subtitle="Profile, reminders and your plan." />

      <div className="stagger space-y-4">
        <Section icon={User} title="Profile" description="How you appear to your coach and the community.">
          <label className="block">
            <span className="field-label">Display name</span>
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loadingProfile}
              className="input-field disabled:opacity-50"
            />
          </label>
          <div className="mt-4 flex justify-end">
            <button onClick={handleSaveProfile} disabled={savingProfile || loadingProfile} className="btn-secondary w-[120px]">
              {savingProfile ? <Spinner /> : null} {savingProfile ? "Saving" : "Save"}
            </button>
          </div>
        </Section>

        <section className="glass-card p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <span className="icon-tile"><Bell className="h-[18px] w-[18px]" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base">Notifications</h2>
              <p className="text-sm text-ink-muted">Updates from Drefit and your coach.</p>
            </div>
            <button
              onClick={handleToggleNotifications}
              role="switch"
              aria-checked={notifications}
              aria-label="Notifications"
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-base ${notifications ? "lime-gradient shadow-glow" : "bg-white/15"}`}
            >
              <span
                className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-elev-1 transition-transform duration-base ease-out ${notifications ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        </section>

        <Section icon={MessageCircle} title="WhatsApp reminders" description="A daily workout nudge, plus a heads-up 3 days and 1 day before your trial or subscription ends.">
          <div className="space-y-4">
            <label className="block">
              <span className="field-label">WhatsApp number</span>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
                <input
                  type="tel"
                  placeholder="WhatsApp number, e.g. 0816 551 0842"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field pl-10 tabular-nums"
                />
              </div>
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.02] px-3.5 py-2.5">
              <span className="flex items-center gap-2.5 text-sm"><Clock className="h-4 w-4 text-ink-subtle" /> Remind me at <span className="text-ink-subtle">(Lagos time)</span></span>
              <select
                value={reminderHour}
                onChange={(e) => setReminderHour(Number(e.target.value))}
                className="input-field min-h-[36px] w-auto py-1.5 pl-3 pr-8 text-sm tabular-nums"
              >
                {Array.from({ length: 17 }, (_, i) => i + 5).map((h) => (
                  <option key={h} value={h} className="bg-surface-2">
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} />
              <span>Yes, send me reminders on WhatsApp</span>
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleSaveReminders} disabled={savingReminders} className="btn-primary w-[168px]">
              {savingReminders ? <Spinner /> : null} {savingReminders ? "Saving" : "Save reminders"}
            </button>
          </div>
        </Section>

        <Section icon={CreditCard} title="Subscription">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold tabular-nums tracking-tight">₦{PLAN_PRICE_NGN.toLocaleString()}</span>
                <span className="text-sm text-ink-muted">/ month</span>
              </div>
              {status === "active" && periodEnd && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted"><CalendarClock className="h-4 w-4" /> Renews {format(new Date(periodEnd), "MMM d, yyyy")}</p>
              )}
              {status === "trialing" && session?.user?.trialEndsAt && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                  <CalendarClock className="h-4 w-4" /> Trial ends {format(new Date(session.user.trialEndsAt), "MMM d, yyyy")}
                </p>
              )}
            </div>
            <span className="chip-accent capitalize">{status === "trialing" ? "Free trial" : status ?? "—"}</span>
          </div>

          <div className="divider my-4" />
          <AnimatePresence mode="wait" initial={false}>
            {!confirmingCancel ? (
              <motion.div key="idle" {...reveal}>
                <button onClick={() => setConfirmingCancel(true)} className="btn-danger btn-sm -ml-3">
                  Cancel subscription
                </button>
              </motion.div>
            ) : (
              <motion.div key="confirm" {...reveal} className="flex flex-wrap items-center gap-3 rounded-xl border border-red-400/20 bg-red-500/[0.06] p-3">
                <AlertTriangle className="h-4 w-4 text-red-300" />
                <span className="flex-1 text-sm">Are you sure you want to cancel?</span>
                <button onClick={() => setConfirmingCancel(false)} className="btn-ghost btn-sm">
                  Never mind
                </button>
                <button onClick={handleCancelSubscription} disabled={cancelling} className="btn-danger btn-sm w-[120px] border border-red-400/30">
                  {cancelling ? <Spinner /> : null} {cancelling ? "Cancelling" : "Yes, cancel"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="glass-card p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-4">
        <span className="icon-tile"><Icon className="h-[18px] w-[18px]" /></span>
        <div className="min-w-0">
          <h2 className="text-base">{title}</h2>
          {description && <p className="text-sm text-ink-muted">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Bell, User, CreditCard, MessageCircle } from "lucide-react"
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
    <div className="page-shell max-w-2xl space-y-6">
      <h1 className="fade-up font-bold">Settings</h1>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="text-drefit-lime" /> Profile
        </div>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loadingProfile}
          className="input-field mb-2 disabled:opacity-50"
        />
        <button
          onClick={handleSaveProfile}
          disabled={savingProfile || loadingProfile}
          className="btn-primary"
        >
          {savingProfile ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="text-drefit-lime" /> Notifications
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`w-12 h-6 rounded-full transition ${notifications ? "bg-drefit-lime" : "bg-white/20"}`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transform transition ${notifications ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-drefit-lime" /> WhatsApp reminders
        </div>
        <p className="text-sm text-ink-muted">
          Get a daily workout reminder and a heads-up 3 days and 1 day before your trial or subscription ends.
        </p>
        <input
          type="tel"
          placeholder="WhatsApp number, e.g. 0803 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input-field"
        />
        <label className="flex items-center gap-2 text-sm">
          Remind me at
          <select
            value={reminderHour}
            onChange={(e) => setReminderHour(Number(e.target.value))}
            className="input-field w-auto px-2 py-1.5"
          >
            {Array.from({ length: 17 }, (_, i) => i + 5).map((h) => (
              <option key={h} value={h} className="bg-drefit-dark">
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
          (Lagos time)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} />
          Yes, send me reminders on WhatsApp
        </label>
        <button
          onClick={handleSaveReminders}
          disabled={savingReminders}
          className="btn-primary"
        >
          {savingReminders ? "Saving..." : "Save reminders"}
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="text-drefit-lime" /> Subscription
        </div>
        <p className="text-drefit-lime text-xl">₦{PLAN_PRICE_NGN.toLocaleString()}/month</p>
        {status === "active" && periodEnd && (
          <p className="text-ink-muted text-sm mt-1">Renews {format(new Date(periodEnd), "MMM d, yyyy")}</p>
        )}
        {status === "trialing" && session?.user?.trialEndsAt && (
          <p className="text-ink-muted text-sm mt-1">
            Trial ends {format(new Date(session.user.trialEndsAt), "MMM d, yyyy")}
          </p>
        )}

        {!confirmingCancel ? (
          <button onClick={() => setConfirmingCancel(true)} className="mt-2 text-red-400">
            Cancel
          </button>
        ) : (
          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm text-ink-muted">Are you sure?</span>
            <button
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="btn-danger"
            >
              {cancelling ? "Cancelling..." : "Yes, cancel"}
            </button>
            <button onClick={() => setConfirmingCancel(false)} className="text-ink-muted">
              Never mind
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Dumbbell, LineChart, MessageCircle, Salad, ShieldCheck, Users } from "lucide-react"
import Logo from "@/components/ui/Logo"
import { PLAN_PRICE_NGN } from "@/lib/paystack/plan"

import Spinner from "@/components/ui/Spinner"

export const dynamic = 'force-dynamic'

export default function SubscriptionPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [PaystackPop, setPaystackPop] = useState<any>(null)

  const periodEnd = session?.user?.subscriptionCurrentPeriodEnd
  const isRenewal =
    session?.user?.subscriptionStatus === "active" &&
    !!periodEnd &&
    new Date(periodEnd) <= new Date()

  useEffect(() => {
    import("@paystack/inline-js").then((mod) => setPaystackPop(() => mod.default))
  }, [])

  // Access is only granted server-side after Paystack's verify API confirms
  // the charge; the client callback alone never unlocks anything.
  const verifyPayment = useCallback(
    async (reference: string) => {
      setLoading(true)
      try {
        const res = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        })
        const result = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error(result.error || "We couldn't confirm your payment yet.")
          return
        }
        await update()
        toast.success("Payment confirmed. Welcome to Premium!")
        router.push("/dashboard")
        router.refresh()
      } finally {
        setLoading(false)
      }
    },
    [router, update]
  )

  // Redirect-flow fallback: Paystack returns to /subscription?reference=...
  useEffect(() => {
    if (status !== "authenticated") return
    const params = new URLSearchParams(window.location.search)
    const reference = params.get("reference") ?? params.get("trxref")
    if (reference) {
      window.history.replaceState(null, "", "/subscription")
      verifyPayment(reference)
    }
  }, [status, verifyPayment])

  const handleSubscribe = async () => {
    if (status !== "authenticated") {
      router.push("/login")
      return
    }
    if (!PaystackPop) {
      toast.error("Payment form is still loading, please try again.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/paystack/initialize", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.access_code) {
        toast.error(data.error || "Could not start checkout")
        setLoading(false)
        return
      }

      const paystack = new PaystackPop()
      paystack.resumeTransaction(data.access_code, {
        onSuccess: (tx: { reference?: string }) => verifyPayment(tx?.reference ?? data.reference),
        onCancel: () => setLoading(false),
        onError: (error: { message: string }) => {
          toast.error(error.message || "Payment failed")
          setLoading(false)
        },
      })
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong starting checkout")
      setLoading(false)
    }
  }

  const perks = [
    { icon: Dumbbell, t: "Personalised workout plans" },
    { icon: Salad, t: "Coach-designed Nigerian meal plans" },
    { icon: MessageCircle, t: "1-on-1 coaching chat" },
    { icon: LineChart, t: "Progress tracking & analytics" },
    { icon: Users, t: "Community access & challenges" },
  ]

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]" />
      <Logo className="relative mb-8" />
      <div className="glass-card fade-up relative w-full max-w-md overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent-fade" />
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">{isRenewal ? "Renewal" : "Premium"}</span>
          <span className="chip"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> Secured by Paystack</span>
        </div>
        <h1 className="mt-3 text-2xl sm:text-[1.75rem]">{isRenewal ? "Renew subscription" : "Premium Monthly"}</h1>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-5xl font-bold tabular-nums tracking-[-0.04em]">₦{PLAN_PRICE_NGN.toLocaleString()}</span>
          <span className="text-ink-muted">/ month</span>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          {isRenewal ? "Your last billing period has ended — renew to keep your access." : "Billed monthly through Paystack."}
        </p>
        <ul className="mt-6 space-y-3 border-t border-line pt-6">
          {perks.map((p) => (
            <li key={p.t} className="flex items-center gap-3 text-sm">
              <span className="icon-tile h-7 w-7 rounded-lg"><p.icon className="h-3.5 w-3.5" /></span>
              {p.t}
            </li>
          ))}
        </ul>
        <button onClick={handleSubscribe} disabled={loading || !PaystackPop} className="btn-primary btn-lg mt-8 w-full">
          {loading ? <><Spinner /> Processing</> : isRenewal ? "Renew now" : "Subscribe now"}
        </button>
        <p className="mt-3 text-center text-xs text-ink-subtle">Cancel anytime. No commitment.</p>
      </div>
    </div>
  )
}

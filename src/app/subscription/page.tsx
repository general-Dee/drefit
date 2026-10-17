"use client"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import Logo from "@/components/ui/Logo"
import { PLAN_PRICE_NGN } from "@/lib/paystack/plan"

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

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]" />
      <Logo className="relative mb-8" />
      <div className="glass-card fade-up relative p-6 sm:p-8 max-w-md w-full text-center">
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">{isRenewal ? "Renew Subscription" : "Premium Monthly"}</h1>
        <p className="my-3 font-display text-5xl font-bold tabular-nums tracking-tight text-accent">₦{PLAN_PRICE_NGN.toLocaleString()}</p>
        <p className="text-ink-muted mb-6">
          {isRenewal ? "Your last billing period has ended — renew to keep your access." : "per month, billed monthly"}
        </p>
        <button onClick={handleSubscribe} disabled={loading || !PaystackPop} className="btn-primary w-full py-4 text-base shadow-glow">
          {loading ? "Processing..." : isRenewal ? "Renew Now" : "Subscribe Now"}
        </button>
        <p className="text-ink-subtle text-sm mt-4">Cancel anytime. No commitment.</p>
      </div>
    </div>
  )
}

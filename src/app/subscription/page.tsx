"use client"
import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
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
    <div className="min-h-screen flex items-center justify-center section-padding">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 max-w-md w-full text-center">
        <h1 className="text-3xl mb-2">{isRenewal ? "Renew Subscription" : "Premium Monthly"}</h1>
        <p className="text-drefit-lime text-4xl mb-2">₦{PLAN_PRICE_NGN.toLocaleString()}</p>
        <p className="text-gray-400 mb-6">
          {isRenewal ? "Your last billing period has ended — renew to keep your access." : "per month, billed monthly"}
        </p>
        <button onClick={handleSubscribe} disabled={loading || !PaystackPop} className="w-full lime-gradient text-drefit-dark font-bold py-3 rounded-lg disabled:opacity-50">
          {loading ? "Processing..." : isRenewal ? "Renew Now" : "Subscribe Now"}
        </button>
        <p className="text-gray-500 text-sm mt-4">Cancel anytime. No commitment.</p>
      </motion.div>
    </div>
  )
}

"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { PLAN_PRICE_NGN } from "@/lib/paystack/plan"

export const dynamic = 'force-dynamic'

export default function SubscriptionPage() {
  const { data: session, status } = useSession()
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
        onSuccess: () => router.push("/dashboard"),
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

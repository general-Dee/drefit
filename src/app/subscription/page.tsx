"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { loadPaystack } from "@paystack/inline-js"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function SubscriptionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const handleSubscribe = async () => {
    if (!session) { router.push("/login"); return }
    setLoading(true)
    const paystack = new (await loadPaystack())()
    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: session.user.email!,
      amount: 5000 * 100,
      currency: "NGN",
      onSuccess: () => { router.push("/dashboard") },
      onCancel: () => { setLoading(false) },
    })
  }
  return (
    <div className="min-h-screen flex items-center justify-center section-padding">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 max-w-md w-full text-center">
        <h1 className="text-3xl mb-2">Premium Monthly</h1>
        <p className="text-drefit-lime text-4xl mb-2">₦5,000</p>
        <p className="text-gray-400 mb-6">per month, billed monthly</p>
        <button onClick={handleSubscribe} disabled={loading} className="w-full lime-gradient text-drefit-dark font-bold py-3 rounded-lg disabled:opacity-50">
          {loading ? "Processing..." : "Start 7-Day Free Trial"}
        </button>
        <p className="text-gray-500 text-sm mt-4">Cancel anytime. No commitment.</p>
      </motion.div>
    </div>
  )
}

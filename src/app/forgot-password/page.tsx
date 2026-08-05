"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Mail } from "lucide-react"
import toast from "react-hot-toast"

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Something went wrong. Please try again.")
        return
      }
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center section-padding">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 w-full max-w-md">
        <h1 className="text-3xl mb-2 text-center">Forgot Password</h1>
        {sent ? (
          <p className="text-gray-400 text-center">
            If an account exists for that email, we&apos;ve sent a reset link. Check your inbox.
          </p>
        ) : (
          <>
            <p className="text-gray-400 text-center mb-6">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={handleSubmit}>
              <div className="relative mb-6">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-drefit-lime outline-none" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="w-full lime-gradient text-drefit-dark font-bold py-3 rounded-lg hover:scale-105 transition disabled:opacity-50">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}

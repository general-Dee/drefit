"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Lock } from "lucide-react"
import toast from "react-hot-toast"

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Something went wrong. Please try again.")
        return
      }
      toast.success("Password updated. Please sign in.")
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center section-padding">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 w-full max-w-md text-center">
          <h1 className="text-3xl mb-2">Invalid Link</h1>
          <p className="text-gray-400">This password reset link is missing or invalid. Please request a new one.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center section-padding">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 w-full max-w-md">
        <h1 className="text-3xl mb-2 text-center">Reset Password</h1>
        <p className="text-gray-400 text-center mb-6">Enter a new password for your account.</p>
        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="password" placeholder="New Password" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-drefit-lime outline-none" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="relative mb-6">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="password" placeholder="Confirm Password" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-drefit-lime outline-none" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="w-full lime-gradient text-drefit-dark font-bold py-3 rounded-lg hover:scale-105 transition disabled:opacity-50">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

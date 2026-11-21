"use client"
import { useState } from "react"
import { Mail } from "lucide-react"
import toast from "react-hot-toast"
import Logo from "@/components/ui/Logo"

import Spinner from "@/components/ui/Spinner"

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]" />
      <Logo className="relative mb-8" />
      <div className="glass-card fade-up relative p-6 sm:p-8 w-full max-w-md">
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2 text-center">Forgot Password</h1>
        {sent ? (
          <p className="text-ink-muted text-center">
            If an account exists for that email, we&apos;ve sent a reset link. Check your inbox.
          </p>
        ) : (
          <>
            <p className="text-ink-muted text-center mb-6">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={handleSubmit}>
              <div className="relative mb-6">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle w-5 h-5" />
                <input type="email" placeholder="Email" className="input-field pl-10" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? <><Spinner /> Sending</> : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

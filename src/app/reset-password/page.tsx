"use client"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock } from "lucide-react"
import toast from "react-hot-toast"
import Logo from "@/components/ui/Logo"

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
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
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]" />
      <Logo className="relative mb-8" />
        <div className="glass-card fade-up relative p-6 sm:p-8 w-full max-w-md text-center">
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Invalid Link</h1>
          <p className="text-ink-muted">This password reset link is missing or invalid. Please request a new one.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]" />
      <Logo className="relative mb-8" />
      <div className="glass-card fade-up relative p-6 sm:p-8 w-full max-w-md">
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2 text-center">Reset Password</h1>
        <p className="text-ink-muted text-center mb-6">Enter a new password for your account.</p>
        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle w-5 h-5" />
            <input type="password" placeholder="New Password" className="input-field pl-10" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="relative mb-6">
            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle w-5 h-5" />
            <input type="password" placeholder="Confirm Password" className="input-field pl-10" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  )
}

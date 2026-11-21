"use client"
import { signIn, getSession } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import AuthShell from "@/components/ui/AuthShell"
import { Mail, Lock } from "lucide-react"
import toast from "react-hot-toast"

import Spinner from "@/components/ui/Spinner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // next-auth's client signIn() throws internally when called with
      // redirect: false for the credentials provider (it builds a URL from
      // a relative base). Swallow that and verify the outcome via the
      // session instead of trusting signIn()'s return value.
      await signIn("credentials", { email, password, redirect: false }).catch(() => {})
      const session = await getSession()
      if (!session) {
        toast.error("Invalid email or password. After several failed attempts, sign-in is paused for 15 minutes.")
        return
      }
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your fitness journey."
      footer={<>Don&apos;t have an account? <Link href="/register" className="font-semibold text-accent">Sign up</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="relative block">
          <span className="sr-only">Email</span>
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
          <input type="email" autoComplete="email" placeholder="Email" className="input-field pl-11" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <label className="relative block">
          <span className="sr-only">Password</span>
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
          <input type="password" autoComplete="current-password" placeholder="Password" className="input-field pl-11" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-accent">Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? <><Spinner /> Signing in</> : "Sign in"}
        </button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-ink-subtle">
        <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
      </div>
      <button onClick={()=>signIn("google",{callbackUrl:"/dashboard"})} className="btn-secondary w-full py-3.5">
        <span className="font-display text-base font-bold">G</span> Continue with Google
      </button>
    </AuthShell>
  )
}

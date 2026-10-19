"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn, getSession } from "next-auth/react"
import toast from "react-hot-toast"
import Link from "next/link"
import AuthShell from "@/components/ui/AuthShell"

import Spinner from "@/components/ui/Spinner"

export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [ref, setRef] = useState<string | null>(null)

  // Capture ?ref=CODE; also kept in a cookie (30 days) so it survives Google
  // sign-in, which creates the account server-side.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref")
    if (code && /^[A-Za-z0-9]{4,16}$/.test(code)) {
      const upper = code.toUpperCase()
      setRef(upper)
      document.cookie = `drefit_ref=${upper}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax; Secure`
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, ref }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Registration failed")
        return
      }

      // next-auth's client signIn() throws internally when called with
      // redirect: false for the credentials provider (it builds a URL from
      // a relative base). Swallow that and verify the outcome via the
      // session instead of trusting signIn()'s return value.
      await signIn("credentials", { email, password, redirect: false }).catch(() => {})
      const session = await getSession()
      if (!session) {
        toast.error("Account created, but sign-in failed. Please try logging in.")
        router.push("/login")
        return
      }

      toast.success("Account created! Let's get you set up.")
      router.push("/onboarding")
    } catch (error: any) {
      toast.error(error.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Join Drefit"
      subtitle="Start your 7-day free trial. Cancel anytime."
      footer={<>Already have an account? <Link href="/login" className="font-semibold text-accent">Sign in</Link></>}
    >
      {ref && (
        <p className="mb-4 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">
          You were invited by a friend (code <span className="font-semibold tabular-nums">{ref}</span>). Make your first payment and you both get 30 extra days.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" autoComplete="name" aria-label="Full name" placeholder="Full name" className="input-field" value={name} onChange={e=>setName(e.target.value)} required />
        <input type="email" autoComplete="email" aria-label="Email" placeholder="Email" className="input-field" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" autoComplete="new-password" aria-label="Password" placeholder="Password" className="input-field" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">{loading ? <><Spinner /> Creating account</> : "Create account"}</button>
      </form>
    </AuthShell>
  )
}

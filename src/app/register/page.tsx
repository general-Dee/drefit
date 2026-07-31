"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import toast from "react-hot-toast"

export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Registration failed")
        return
      }

      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 max-w-md w-full">
        <h1 className="text-3xl mb-6">Join Drefit</h1>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Full Name" className="w-full bg-white/5 border border-white/10 rounded p-3 mb-4" value={name} onChange={e=>setName(e.target.value)} required />
          <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded p-3 mb-4" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded p-3 mb-4" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full lime-gradient text-drefit-dark font-bold py-3 rounded">Create Account</button>
        </form>
      </div>
    </div>
  )
}

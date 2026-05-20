"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { hash } from "bcryptjs"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { motion } from "framer-motion"
import { User, Mail, Lock } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const supabase = createClient()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const hashed = await hash(password, 10)
    const { error } = await supabase.from("users").insert({ email, name, password: hashed, subscriptionStatus: "inactive" })
    if (error) return alert("Email already exists")
    await signIn("credentials", { email, password, callbackUrl: "/onboarding" })
  }
  return (
    <div className="min-h-screen flex items-center justify-center section-padding">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 w-full max-w-md">
        <h1 className="text-3xl mb-2 text-center">Join Drefit</h1>
        <p className="text-gray-400 text-center mb-6">Start your transformation today</p>
        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Full Name" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-drefit-lime outline-none" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div className="relative mb-4">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-drefit-lime outline-none" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="relative mb-6">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-drefit-lime outline-none" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="w-full lime-gradient text-drefit-dark font-bold py-3 rounded-lg hover:scale-105 transition">Create Account</button>
        </form>
        <p className="text-center mt-6 text-gray-400">Already have an account? <Link href="/login" className="text-drefit-lime">Sign in</Link></p>
      </motion.div>
    </div>
  )
}

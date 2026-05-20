"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Lock, Chrome } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn("credentials", { email, password, callbackUrl: "/dashboard" })
  }
  return (
    <div className="min-h-screen flex items-center justify-center section-padding">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 w-full max-w-md">
        <h1 className="text-3xl mb-2 text-center">Welcome Back</h1>
        <p className="text-gray-400 text-center mb-6">Sign in to continue your fitness journey</p>
        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-drefit-lime outline-none" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="relative mb-6">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:border-drefit-lime outline-none" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="w-full lime-gradient text-drefit-dark font-bold py-3 rounded-lg hover:scale-105 transition">Sign In</button>
        </form>
        <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-drefit-dark text-gray-400">Or</span></div></div>
        <button onClick={()=>signIn("google",{callbackUrl:"/dashboard"})} className="w-full border border-white/20 rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-white/5"><Chrome className="w-5 h-5" /> Google</button>
        <p className="text-center mt-6 text-gray-400">Don't have an account? <Link href="/register" className="text-drefit-lime">Sign up</Link></p>
      </motion.div>
    </div>
  )
}

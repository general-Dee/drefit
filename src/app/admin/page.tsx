"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Users, DollarSign, Dumbbell } from "lucide-react"

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  useEffect(() => { if (session?.user?.email !== "admin@drefit.com") router.push("/dashboard") }, [session])
  if (!session || session.user?.email !== "admin@drefit.com") return null
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl">Admin Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card p-4"><Users className="text-drefit-lime"/> Total Users: 1,247</div>
        <div className="glass-card p-4"><DollarSign className="text-drefit-lime"/> MRR: ₦4.46M</div>
        <div className="glass-card p-4"><Dumbbell className="text-drefit-lime"/> Workouts: 45</div>
      </div>
      <div className="glass-card p-4"><h2 className="text-xl mb-2">Create Workout</h2><input placeholder="Name" className="w-full bg-white/5 border border-white/10 rounded p-2 mb-2"/><button className="bg-drefit-lime text-drefit-dark px-4 py-2 rounded">Create</button></div>
    </div>
  )
}

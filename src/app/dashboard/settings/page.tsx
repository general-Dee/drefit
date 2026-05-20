"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Bell, User, CreditCard } from "lucide-react"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-3xl">Settings</h1>
      <div className="glass-card p-4"><div className="flex items-center gap-2 mb-3"><User className="text-drefit-lime"/> Profile</div><input placeholder="Name" className="w-full bg-white/5 border border-white/10 rounded p-2 mb-2"/><button className="bg-drefit-lime text-drefit-dark px-4 py-2 rounded">Save</button></div>
      <div className="glass-card p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Bell className="text-drefit-lime"/> Notifications</div><button onClick={()=>setNotifications(!notifications)} className={`w-12 h-6 rounded-full transition ${notifications ? "bg-drefit-lime" : "bg-white/20"}`}><div className={`w-5 h-5 bg-white rounded-full transform transition ${notifications ? "translate-x-6" : "translate-x-1"}`}/></button></div></div>
      <div className="glass-card p-4"><div className="flex items-center gap-2 mb-2"><CreditCard className="text-drefit-lime"/> Subscription</div><p className="text-drefit-lime text-xl">₦5,000/month</p><button className="mt-2 text-red-400">Cancel</button></div>
    </div>
  )
}

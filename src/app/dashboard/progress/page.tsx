"use client"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Camera, Scale } from "lucide-react"

const data = [{ week: "Week 1", weight: 85 }, { week: "Week 2", weight: 84.2 }, { week: "Week 3", weight: 83.5 }]
export default function ProgressPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl">Progress Tracker</h1>
      <div className="glass-card p-4 h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><XAxis dataKey="week" stroke="#666"/><YAxis stroke="#666"/><Tooltip/><Area type="monotone" dataKey="weight" stroke="#C8F135" fill="#C8F135" fillOpacity={0.2}/></AreaChart></ResponsiveContainer></div>
      <div className="grid md:grid-cols-2 gap-4">
        <button className="glass-card p-4 flex items-center gap-3"><Scale className="text-drefit-lime"/> Log Weight</button>
        <button className="glass-card p-4 flex items-center gap-3"><Camera className="text-drefit-lime"/> Upload Photo</button>
      </div>
    </div>
  )
}

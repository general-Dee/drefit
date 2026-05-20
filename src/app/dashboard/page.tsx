"use client"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Flame, Calendar, Activity, Award, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const { data: session } = useSession()
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl">Welcome back, {session?.user?.name?.split(" ")[0] || "Athlete"}! 👋</h1>
        <p className="text-gray-400">Ready to crush your goals today?</p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
          <div className="flex justify-between items-center"><Flame className="w-8 h-8 text-drefit-lime" /><span className="text-2xl font-bold">1,280</span></div>
          <p className="text-gray-400 mt-2">Calories Today</p>
          <div className="mt-2 h-1 bg-white/10 rounded-full"><div className="w-3/4 h-full bg-drefit-lime rounded-full"></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4">
          <div className="flex justify-between items-center"><Calendar className="w-8 h-8 text-drefit-lime" /><span className="text-2xl font-bold">4/7</span></div>
          <p className="text-gray-400 mt-2">Workouts This Week</p>
          <div className="mt-2 h-1 bg-white/10 rounded-full"><div className="w-[57%] h-full bg-drefit-lime rounded-full"></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4">
          <div className="flex justify-between items-center"><Award className="w-8 h-8 text-drefit-lime" /><span className="text-2xl font-bold">12</span></div>
          <p className="text-gray-400 mt-2">Day Streak 🔥</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4">
          <div className="flex justify-between items-center"><TrendingUp className="w-8 h-8 text-drefit-lime" /><span className="text-2xl font-bold">-2.5kg</span></div>
          <p className="text-gray-400 mt-2">Total Progress</p>
        </motion.div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-4"><h2 className="text-xl mb-2">Today's Workout</h2><p>Upper Body Strength • 45 mins</p><button className="mt-2 px-4 py-2 bg-drefit-lime text-drefit-dark rounded-lg">Start</button></div>
        <div className="glass-card p-4"><h2 className="text-xl mb-2">Today's Meal</h2><p>Grilled Chicken & Jollof Rice</p><p className="text-drefit-lime">650 cal</p></div>
      </div>
    </div>
  )
}

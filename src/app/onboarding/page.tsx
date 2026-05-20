"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Target, Activity, Utensils, Calendar, ChevronRight } from "lucide-react"

const steps = [
  { id: 0, title: "Fitness Goal", icon: Target, options: ["Weight Loss", "Muscle Gain", "Endurance", "Flexibility"] },
  { id: 1, title: "Fitness Level", icon: Activity, options: ["Beginner", "Intermediate", "Advanced"] },
  { id: 2, title: "Dietary Preference", icon: Utensils, options: ["Omnivore", "Vegetarian", "Vegan", "Keto", "Halal"] },
  { id: 3, title: "Schedule Availability", icon: Calendar, options: ["Early Morning", "Morning", "Afternoon", "Evening", "Late Night"] },
]

export default function OnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({ fitnessGoal: "", fitnessLevel: "", dietaryPreference: "", schedule: "" })
  const handleSelect = async (val: string) => {
    const key = ["fitnessGoal","fitnessLevel","dietaryPreference","schedule"][step]
    const newAnswers = { ...answers, [key]: val.toLowerCase().replace(" ", "-") }
    setAnswers(newAnswers)
    if (step === 3) {
      await supabase.from("users").update(newAnswers).eq("id", session?.user?.id)
      router.push("/subscription")
    } else {
      setStep(step + 1)
    }
  }
  const progress = ((step + 1) / steps.length) * 100
  const Icon = steps[step].icon
  return (
    <div className="min-h-screen flex items-center justify-center section-padding">
      <div className="glass-card p-8 max-w-md w-full">
        <div className="mb-6"><div className="h-2 bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full lime-gradient" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div></div>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-drefit-lime/10 mb-4"><Icon className="w-8 h-8 text-drefit-lime" /></div>
          <h2 className="text-2xl">{steps[step].title}</h2>
        </div>
        <div className="space-y-2">
          {steps[step].options.map(opt => (
            <button key={opt} onClick={()=>handleSelect(opt)} className="w-full glass-card p-4 text-left hover:border-drefit-lime transition flex justify-between items-center">
              <span>{opt}</span><ChevronRight className="w-5 h-5 text-drefit-lime opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
        {step > 0 && <button onClick={()=>setStep(step-1)} className="mt-6 text-gray-400 hover:text-drefit-lime">← Go Back</button>}
      </div>
    </div>
  )
}

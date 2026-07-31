"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

export const dynamic = 'force-dynamic'

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [answers, setAnswers] = useState({
    fitnessGoal: "",
    fitnessLevel: "",
    dietaryPreference: "",
    schedule: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status])

  const questions = ["Fitness Goal?", "Fitness Level?", "Dietary Preference?", "Schedule Availability?"]
  const options = [["Weight Loss","Muscle Gain","Endurance"],["Beginner","Intermediate","Advanced"],["Omnivore","Vegetarian","Keto","Halal"],["Morning","Afternoon","Evening"]]

  const handleSelect = async (val: string) => {
    const key = ["fitnessGoal","fitnessLevel","dietaryPreference","schedule"][step]
    const newAnswers = { ...answers, [key]: val.toLowerCase().replace(" ", "-") }
    setAnswers(newAnswers)
    if (step === 3) {
      setSaving(true)
      try {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAnswers),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          toast.error(data.error || "Could not save your answers, please try again.")
          setSaving(false)
          return
        }
        router.push("/subscription")
      } catch {
        toast.error("Something went wrong saving your answers.")
        setSaving(false)
      }
    } else {
      setStep(step + 1)
    }
  }

  if (status === "loading") return <div className="text-center mt-20">Loading...</div>
  if (!session) return null

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 max-w-md w-full">
        <h2 className="text-2xl mb-4">{questions[step]}</h2>
        {options[step].map(opt => (
          <button key={opt} disabled={saving} onClick={() => handleSelect(opt)} className="w-full glass-card p-3 mb-2 text-left hover:border-drefit-lime disabled:opacity-50">
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

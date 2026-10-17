"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"
import type { FirstWeekPlan } from "@/lib/first-week-plan"

export const dynamic = "force-dynamic"

type Answers = {
  fitnessGoal: string
  fitnessLevel: string
  daysPerWeek: number
  equipment: string
  limitations: string[]
  limitationsNote: string
  dietaryPreference: string
}

type Option = { value: string | number; label: string; hint?: string }
type Step =
  | { key: "fitnessGoal" | "fitnessLevel" | "equipment" | "dietaryPreference" | "daysPerWeek"; title: string; subtitle?: string; options: Option[]; multi?: false }
  | { key: "limitations"; title: string; subtitle?: string; options: Option[]; multi: true }

const ONBOARDING_STEPS: Step[] = [
  { key: "fitnessGoal", title: "What's your main goal?", options: [
    { value: "weight-loss", label: "Lose weight", hint: "Burn fat, feel lighter" },
    { value: "muscle-gain", label: "Build muscle", hint: "Get stronger and fuller" },
    { value: "endurance", label: "Boost endurance", hint: "Go longer, recover faster" },
  ] },
  { key: "fitnessLevel", title: "How experienced are you?", options: [
    { value: "beginner", label: "Beginner", hint: "New or returning after a long break" },
    { value: "intermediate", label: "Intermediate", hint: "Training on and off for a while" },
    { value: "advanced", label: "Advanced", hint: "Consistent training for 1+ years" },
  ] },
  { key: "daysPerWeek", title: "How many days a week can you train?", options: [2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n} days` })) },
  { key: "equipment", title: "What equipment do you have?", options: [
    { value: "none", label: "No equipment", hint: "Bodyweight only" },
    { value: "home", label: "Home kit", hint: "Dumbbells, bands, kettlebell" },
    { value: "gym", label: "Full gym", hint: "Machines, barbells, cables" },
  ] },
  { key: "limitations", multi: true, title: "Any injuries or limitations?", subtitle: "Choose all that apply. We'll leave out workouts that could aggravate them.", options: [
    { value: "knee", label: "Knees" },
    { value: "lower-back", label: "Lower back" },
    { value: "shoulder", label: "Shoulders" },
    { value: "wrist", label: "Wrists" },
    { value: "low-impact", label: "I need low-impact" },
  ] },
  { key: "dietaryPreference", title: "How do you eat?", options: [
    { value: "omnivore", label: "Everything" },
    { value: "vegetarian", label: "Vegetarian" },
    { value: "keto", label: "Keto / low-carb" },
    { value: "halal", label: "Halal" },
  ] },
]

export default function OnboardingPage() {
  const { status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [plan, setPlan] = useState<FirstWeekPlan | null>(null)
  const [answers, setAnswers] = useState<Answers>({
    fitnessGoal: "", fitnessLevel: "", daysPerWeek: 3, equipment: "", limitations: [], limitationsNote: "", dietaryPreference: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const current = ONBOARDING_STEPS[step]
  const progress = useMemo(() => Math.round(((plan ? ONBOARDING_STEPS.length : step) / ONBOARDING_STEPS.length) * 100), [step, plan])

  const submit = async (final: Answers) => {
    setSaving(true)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(final),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Could not save your answers, please try again.")
        return
      }
      setPlan(data.plan)
    } catch {
      toast.error("Something went wrong saving your answers.")
    } finally {
      setSaving(false)
    }
  }

  const next = (updated: Answers) => {
    setAnswers(updated)
    if (step === ONBOARDING_STEPS.length - 1) submit(updated)
    else setStep(step + 1)
  }

  const choose = (opt: Option) => {
    if (current.multi) {
      const v = String(opt.value)
      const list = answers.limitations.includes(v) ? answers.limitations.filter((x) => x !== v) : [...answers.limitations, v]
      setAnswers({ ...answers, limitations: list })
      return
    }
    next({ ...answers, [current.key]: opt.value } as Answers)
  }

  if (status === "loading") return <div className="text-center mt-20">Loading...</div>

  if (plan) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="glass-card p-6 max-w-lg w-full space-y-4" data-testid="first-week-reveal">
          <h1 className="text-3xl">Your first week is ready</h1>
          <p className="text-gray-400">
            {plan.workoutDays} training days · {plan.totalMinutes} minutes total, picked from your coach&apos;s workouts.
          </p>
          <ul className="space-y-2">
            {plan.days.map((d) => (
              <li key={d.day} className="flex justify-between gap-3 border-b border-white/10 pb-2 text-sm">
                <span className="text-gray-400">Day {d.day} · {d.weekday.slice(0, 3)}</span>
                <span>{d.type === "workout" ? `${d.workout?.name} (${d.workout?.duration} min)` : d.type === "mobility" ? "Mobility session" : "Rest"}</span>
              </li>
            ))}
          </ul>
          {plan.notes.map((n) => (
            <p key={n} className="text-xs text-gray-500">{n}</p>
          ))}
          <button onClick={() => router.push("/dashboard")} className="w-full bg-drefit-lime text-drefit-dark font-bold py-3 rounded-lg">
            Start my first week
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="glass-card p-8 max-w-md w-full">
        <div className="mb-4 h-1.5 w-full rounded bg-white/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded bg-drefit-lime" style={{ width: `${progress}%` }} />
        </div>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="mb-3 flex items-center gap-1 text-sm text-gray-400">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        <h2 className="text-2xl mb-1">{current.title}</h2>
        {current.subtitle && <p className="text-sm text-gray-400 mb-4">{current.subtitle}</p>}
        {current.options.map((opt) => {
          const selected = current.multi ? answers.limitations.includes(String(opt.value)) : answers[current.key] === opt.value
          return (
            <button
              key={String(opt.value)}
              disabled={saving}
              onClick={() => choose(opt)}
              aria-pressed={selected}
              className={`w-full glass-card p-3 mb-2 text-left hover:border-drefit-lime disabled:opacity-50 ${selected ? "border-drefit-lime" : ""}`}
            >
              <div>{opt.label}</div>
              {opt.hint && <div className="text-xs text-gray-400">{opt.hint}</div>}
            </button>
          )
        })}
        {current.multi && (
          <>
            <textarea
              placeholder="Anything else your coach should know? (optional)"
              value={answers.limitationsNote}
              maxLength={300}
              onChange={(e) => setAnswers({ ...answers, limitationsNote: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm mb-3"
            />
            <button onClick={() => next(answers)} disabled={saving} className="w-full bg-drefit-lime text-drefit-dark font-bold py-3 rounded-lg disabled:opacity-50">
              {answers.limitations.length ? "Continue" : "None — continue"}
            </button>
          </>
        )}
        {saving && <p className="mt-3 text-sm text-gray-400">Building your first week…</p>}
      </div>
    </div>
  )
}

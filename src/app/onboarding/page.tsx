"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Check, Dumbbell, Flame, HeartPulse, Home, Moon, Sparkles, StretchHorizontal, Zap } from "lucide-react"
import Logo from "@/components/ui/Logo"
import toast from "react-hot-toast"
import type { FirstWeekPlan } from "@/lib/first-week-plan"

import Spinner from "@/components/ui/Spinner"

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
  const [dir, setDir] = useState(1)
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
    else {
      setDir(1)
      setStep(step + 1)
    }
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

  const back = () => {
    setDir(-1)
    setStep(Math.max(0, step - 1))
  }

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center" aria-busy="true">
        <div className="skeleton h-2 w-40" />
      </div>
    )
  }

  if (plan) return <Reveal plan={plan} onStart={() => router.push("/dashboard")} />

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]" />

      {/* Top bar: back + progress */}
      <header className="relative z-10 mx-auto w-full max-w-xl px-5 pt-5">
        <div className="flex h-10 items-center justify-between">
          {step > 0 ? (
            <button onClick={back} disabled={saving} className="btn-ghost -ml-3" aria-label="Back">
              <ArrowLeft className="h-5 w-5" /> Back
            </button>
          ) : (
            <Logo href="/onboarding" />
          )}
          <span className="text-xs font-medium tabular-nums text-ink-subtle">
            {step + 1} / {ONBOARDING_STEPS.length}
          </span>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            className="h-full origin-left rounded-full bg-accent"
            initial={false}
            animate={{ scaleX: Math.max(0.04, (step + (saving ? 1 : 0.5)) / ONBOARDING_STEPS.length) }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-8 pt-8">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.section
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            <div className="eyebrow mb-3">Step {step + 1}</div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">{current.title}</h1>
            {current.subtitle && <p className="mt-2 text-ink-muted">{current.subtitle}</p>}

            <div className={`mt-8 grid gap-3 ${current.key === "daysPerWeek" ? "grid-cols-5" : current.multi ? "grid-cols-2" : ""}`}>
              {current.options.map((opt) => {
                const selected = current.multi ? answers.limitations.includes(String(opt.value)) : answers[current.key] === opt.value
                const Icon = OPTION_ICONS[String(opt.value)]
                const compact = current.key === "daysPerWeek"
                return (
                  <motion.button
                    key={String(opt.value)}
                    disabled={saving}
                    onClick={() => choose(opt)}
                    aria-pressed={selected}
                    whileTap={{ scale: 0.97 }}
                    className={`glass-card group flex text-left transition-colors disabled:opacity-50 ${
                      compact ? "flex-col items-center justify-center px-2 py-5 text-center" : "items-center gap-4 p-4 sm:p-5"
                    } ${selected ? "!border-accent bg-accent/10 shadow-glow" : "hover:!border-white/20"}`}
                  >
                    {compact ? (
                      <>
                        <span className="font-display text-3xl font-bold tabular-nums">{opt.value}</span>
                        <span className="mt-1 text-xs text-ink-muted">days</span>
                      </>
                    ) : (
                      <>
                        {Icon && (
                          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors ${selected ? "bg-accent text-accent-ink" : "bg-white/[0.06] text-accent"}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{opt.label}</span>
                          {opt.hint && <span className="mt-0.5 block text-sm text-ink-muted">{opt.hint}</span>}
                        </span>
                        {current.multi && (
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${selected ? "border-accent bg-accent text-accent-ink" : "border-white/20"}`}>
                            {selected && <Check className="h-3.5 w-3.5" />}
                          </span>
                        )}
                      </>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {current.multi && (
              <div className="mt-4 space-y-4">
                <textarea
                  placeholder="Anything else your coach should know? (optional)"
                  aria-label="Anything else your coach should know?"
                  value={answers.limitationsNote}
                  maxLength={300}
                  rows={3}
                  onChange={(e) => setAnswers({ ...answers, limitationsNote: e.target.value })}
                  className="input-field resize-none text-sm"
                />
              </div>
            )}

            <div className="mt-auto pt-8">
              {current.multi && (
                <button onClick={() => next(answers)} disabled={saving} className="btn-primary w-full py-4 text-base">
                  {saving ? <><Spinner /> Building your first week…</> : answers.limitations.length ? "Continue" : "None — continue"}
                </button>
              )}
              {!current.multi && saving && <p className="text-center text-sm text-ink-muted">Building your first week…</p>}
            </div>
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  )
}

const OPTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "weight-loss": Flame,
  "muscle-gain": Dumbbell,
  endurance: HeartPulse,
  beginner: Sparkles,
  intermediate: Zap,
  advanced: Flame,
  none: StretchHorizontal,
  home: Home,
  gym: Dumbbell,
}

function Reveal({ plan, onStart }: { plan: FirstWeekPlan; onStart: () => void }) {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-5 py-10" data-testid="first-week-reveal">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[120px]"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="relative w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent text-accent-ink shadow-glow"
        >
          <Check className="h-8 w-8" strokeWidth={3} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} className="mt-6 text-center">
          <div className="eyebrow">All set</div>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Your first week is ready</h1>
          <p className="mt-3 text-ink-muted">
            <span className="font-semibold tabular-nums text-ink">{plan.workoutDays}</span> training days ·{" "}
            <span className="font-semibold tabular-nums text-ink">{plan.totalMinutes}</span> minutes total, picked from your coach&apos;s workouts.
          </p>
        </motion.div>

        <ul className="mt-8 space-y-2">
          {plan.days.map((d, i) => (
            <motion.li
              key={d.day}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`glass-card flex items-center gap-4 px-4 py-3 ${d.type === "workout" ? "" : "opacity-80"}`}
            >
              <span className="w-12 shrink-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">Day {d.day}</span>
                <span className="block text-sm font-semibold">{d.weekday.slice(0, 3)}</span>
              </span>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${d.type === "workout" ? "bg-accent/15 text-accent" : "bg-white/[0.05] text-ink-muted"}`}>
                {d.type === "workout" ? <Dumbbell className="h-4 w-4" /> : d.type === "mobility" ? <StretchHorizontal className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {d.type === "workout" ? d.workout?.name : d.type === "mobility" ? "Mobility session" : "Rest"}
              </span>
              {d.type === "workout" && <span className="chip tabular-nums">{d.workout?.duration} min</span>}
            </motion.li>
          ))}
        </ul>

        {plan.notes.map((n) => (
          <p key={n} className="mt-4 text-center text-xs text-ink-subtle">{n}</p>
        ))}

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + plan.days.length * 0.07 }}
          onClick={onStart}
          className="btn-primary mt-8 w-full py-4 text-base shadow-glow"
        >
          Start my first week
        </motion.button>
      </div>
    </div>
  )
}

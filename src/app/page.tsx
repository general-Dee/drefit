"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Dumbbell, Apple, Users, TrendingUp, Check, Flame, MessageCircle } from "lucide-react"
import { PLAN_PRICE_NGN } from "@/lib/paystack/plan"
import Logo from "@/components/ui/Logo"

const ease = [0.22, 1, 0.36, 1] as const
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease },
})

const features = [
  { icon: Dumbbell, title: "Personalised coaching", description: "Expert trainers design workouts tailored to your goals." },
  { icon: Apple, title: "Coach-designed diet plans", description: "Nigerian meal plans with local recipes, built by your coach." },
  { icon: Users, title: "Vibrant community", description: "Train alongside fitness enthusiasts across Nigeria." },
  { icon: TrendingUp, title: "Progress tracking", description: "Streaks, weight trends and before/after photos." },
]

const perks = [
  "Personalised workout plans",
  "Coach-designed meal plans with Nigerian recipes",
  "1-on-1 coaching chat",
  "Progress tracking & analytics",
  "Community access & challenges",
]

const previewWeek = [
  { day: "Mon", title: "Full-body strength", done: true },
  { day: "Tue", title: "Rest & mobility", rest: true, done: true },
  { day: "Wed", title: "Lower body + core", done: false, today: true },
  { day: "Thu", title: "Rest", rest: true },
  { day: "Fri", title: "Upper body push/pull" },
]

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <header className="relative z-20 mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <Logo />
        <nav className="flex items-center gap-1">
          <Link href="#pricing" className="btn-ghost hidden sm:inline-flex">Pricing</Link>
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/register" className="btn-primary px-4 py-2">Start free</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 md:px-8 md:pt-16 lg:grid-cols-[1.15fr_1fr]">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
        <div className="relative text-center lg:text-left">
          <motion.div {...rise(0)} className="chip mx-auto mb-6 lg:mx-0">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> 7-day free trial · Cancel anytime
          </motion.div>
          <motion.h1 {...rise(0.05)} className="font-display text-5xl font-bold sm:text-6xl md:text-7xl">
            Train like a champion.
            <br />
            <span className="text-accent">Eat like one too.</span>
          </motion.h1>
          <motion.p {...rise(0.15)} className="mx-auto mt-6 max-w-xl text-lg text-ink-muted lg:mx-0">
            Personalised coaching, coach-designed Nigerian meal plans and a community that keeps you showing up.
          </motion.p>
          <motion.div {...rise(0.25)} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/register" className="btn-primary btn-lg">
              Start your journey <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="#pricing" className="btn-secondary btn-lg">
              View pricing
            </Link>
          </motion.div>
        </div>

        {/* Product preview (illustrative, static content) */}
        <motion.div {...rise(0.3)} className="relative mx-auto w-full max-w-sm" aria-hidden>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="eyebrow">Your first week</div>
                <div className="mt-1 font-display text-xl font-semibold">3 sessions · 30 min</div>
              </div>
              <div className="grid h-14 w-14 place-items-center rounded-full border-4 border-accent/80 text-sm font-semibold tabular-nums">2/3</div>
            </div>
            <ul className="mt-5 space-y-2">
              {previewWeek.map((d) => (
                <li
                  key={d.day}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                    d.today ? "border-accent/50 bg-accent/[0.08]" : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  <span className="w-9 text-xs font-semibold text-ink-subtle">{d.day}</span>
                  <span className={`flex-1 ${d.rest ? "text-ink-muted" : ""}`}>{d.title}</span>
                  {d.done && <Check className="h-4 w-4 text-accent" />}
                  {d.today && <span className="text-xs font-semibold text-accent">Today</span>}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card absolute -bottom-6 -left-6 hidden items-center gap-3 px-4 py-3 sm:flex">
            <Flame className="h-5 w-5 text-accent" />
            <div>
              <div className="text-xs text-ink-subtle">Streak</div>
              <div className="font-display font-semibold tabular-nums">5 days</div>
            </div>
          </div>
          <div className="glass-card absolute -right-4 -top-5 hidden items-center gap-2 px-3 py-2 text-xs sm:flex">
            <MessageCircle className="h-4 w-4 text-[#25D366]" /> Coach on WhatsApp
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow mb-3">Why Drefit</div>
          <h2 className="font-display text-3xl font-bold md:text-5xl">Everything you need to succeed</h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              style={{ animationDelay: `${i * 60}ms` }}
              className="glass-card card-interactive fade-up p-6"
            >
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative mx-auto max-w-6xl scroll-mt-16 px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow mb-3">Pricing</div>
          <h2 className="font-display text-3xl font-bold md:text-5xl">Simple, transparent pricing</h2>
          <p className="mt-3 text-ink-muted">One plan. Everything included.</p>
        </div>
        <div
          className="glass-card fade-up mx-auto mt-10 max-w-md overflow-hidden p-8"
        >
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">Premium Monthly</span>
            <span className="chip">7-day free trial</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-5xl font-bold tabular-nums tracking-tight">₦{PLAN_PRICE_NGN.toLocaleString()}</span>
            <span className="text-ink-muted">/ month</span>
          </div>
          <ul className="mt-6 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
                  <Check className="h-3 w-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <Link href="/register" className="btn-primary btn-lg mt-8 w-full">
            Start 7-day free trial
          </Link>
          <p className="mt-3 text-center text-xs text-ink-subtle">Cancel anytime. No commitment.</p>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-8 text-sm text-ink-subtle md:flex-row md:px-8">
        <Logo />
        <span>© {new Date().getFullYear()} Drefit. Made in Nigeria.</span>
      </footer>
    </main>
  )
}

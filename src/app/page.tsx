import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight, ArrowUpRight, Check, Dumbbell, Flame, LineChart, MessageCircle, Plus, Salad, ShieldCheck, Users, WifiOff, Gift, X,
} from "lucide-react"
import { PLAN_PRICE_NGN, TRIAL_DAYS, PLAN_PERIOD_DAYS } from "@/lib/paystack/plan"
import { accentFont } from "./fonts"
import SiteNav from "@/components/marketing/SiteNav"
import SiteFooter from "@/components/marketing/SiteFooter"
import Reveal from "@/components/marketing/Reveal"
import Photo from "@/components/marketing/Photo"
import { PHOTOS } from "@/components/marketing/images"

export const metadata: Metadata = {
  title: "Drefit · Coach-designed fitness and Nigerian meal plans",
  description:
    "Workouts built around your goal, your equipment and your week, meal plans built on Nigerian food, and a coach in your corner. Start with a 7-day free trial, no card needed.",
  openGraph: {
    title: "Drefit · Train like a champion. Eat like one too.",
    description: "Coach-designed workouts, Nigerian meal plans and a coach in your corner. 7-day free trial, no card needed.",
    type: "website",
  },
}

const price = `₦${PLAN_PRICE_NGN.toLocaleString("en-NG")}`

const previewWeek = [
  { day: "Mon", title: "Full-body strength", done: true },
  { day: "Tue", title: "Rest & mobility", rest: true, done: true },
  { day: "Wed", title: "Lower body + core", today: true },
  { day: "Thu", title: "Rest", rest: true },
  { day: "Fri", title: "Upper body push/pull" },
]

const problems = [
  { title: "Plans built for someone else", body: "Programmes written for a gym you don't have, a schedule you don't keep and a body that isn't yours." },
  { title: "Meal plans you can't shop for", body: "Ingredients you can't find, portions that don't fit and food that has nothing to do with what's on your table." },
  { title: "Nobody to ask", body: "When a knee twinges or a week goes sideways, you're left guessing, and guessing is where most people quit." },
]

const steps = [
  { n: "01", title: "Tell us about you", body: "Six quick questions: your goal, your level, how many days you can train, your equipment, any injuries and how you eat." },
  { n: "02", title: "Get your first week", body: "A seven-day plan is ready the moment you finish, with sessions spread around rest days and meals matched to your diet." },
  { n: "03", title: "Train, eat, check in", body: "Follow each session, log your progress and message your coach whenever you need a hand. Then do it again next week." },
]

const included = [
  { icon: Dumbbell, title: "Training built around you", body: "Coach-designed workouts filtered by your goal, level and equipment, from no-kit bodyweight to a full gym. Anything that could aggravate an injury you flag is left out." },
  { icon: MessageCircle, title: "A coach in your corner", body: "Private one-to-one chat with your coach for form questions, bad weeks and plan changes." },
  { icon: LineChart, title: "Progress you can see", body: "Streaks, a weight trend line and a before-and-after photo slider that show the change week by week." },
  { icon: Users, title: "A community that shows up", body: "Share wins, cheer others on and keep each other honest on the community feed and leaderboard." },
  { icon: WifiOff, title: "Works when the network doesn't", body: "Install Drefit on your phone. Workouts you've opened stay available offline and completions sync when you're back." },
]

const pricingPerks = [
  "Personalised workout plans",
  "Coach-designed meal plans with Nigerian recipes",
  "One-to-one coaching chat",
  "Progress tracking: streaks, weight trend, photos",
  "Community feed and leaderboard",
  "Offline workouts on your phone",
]

const faqs = [
  { q: "Do I need a gym?", a: "No. During setup you choose no equipment, a home kit (dumbbells, bands, a kettlebell) or a full gym, and your plan is built from workouts that fit." },
  { q: `What happens after the ${TRIAL_DAYS}-day trial?`, a: `Your trial is free and needs no card. When it ends, one payment of ${price} through Paystack unlocks ${PLAN_PERIOD_DAYS} days of full access.` },
  { q: "Will I be charged automatically?", a: `No. Each payment covers ${PLAN_PERIOD_DAYS} days and nothing renews behind your back. If you renew early, the new ${PLAN_PERIOD_DAYS} days are added on top of the days you have left.` },
  { q: "I have an injury. Is Drefit for me?", a: "Tell us about knees, lower back, shoulders, wrists or a need for low-impact training during setup and we'll leave out workouts that could aggravate them. Your coach is a message away if you're unsure about anything." },
  { q: "Can the meal plans fit how I eat?", a: "Yes. Choose everything, vegetarian, keto/low-carb or halal, and your weekday meals are matched to it." },
  { q: "Is my payment secure?", a: "Payments are handled by Paystack in their own secure window. Drefit never sees or stores your card details." },
]

function Kicker({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return <div className={`kicker ${center ? "kicker-center" : ""}`}>{children}</div>
}

export default function Home() {
  return (
    <div className={`${accentFont.variable} relative`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface-3 focus:px-4 focus:py-2">Skip to content</a>
      <SiteNav />

      <main id="main" className="relative overflow-x-clip">
        {/* ───────────── Hero ───────────── */}
        <section className="relative">
          <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-accent/[0.07] blur-[140px]" />
          <div className="mk-shell relative grid items-center gap-16 pb-24 pt-12 md:pb-32 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
            <div>
              <div className="fade-up"><Kicker>Coach-led fitness, built for Nigeria</Kicker></div>
              <h1 className="display-1 fade-up mt-6 [animation-delay:60ms]">
                Train like a champion.
                <br />
                <span className="text-accent">Eat like one <span className="serif-em">too.</span></span>
              </h1>
              <p className="lede fade-up mt-8 [animation-delay:140ms]">
                Workouts built around your goal, your equipment and your week. Meal plans built on the Nigerian food you already eat. And a real coach in your corner, so this time it sticks.
              </p>
              <div className="fade-up mt-10 flex flex-col gap-3 [animation-delay:220ms] sm:flex-row">
                <Link href="/register" className="btn-primary btn-lg group">
                  Start your {TRIAL_DAYS}-day free trial
                  <ArrowRight className="h-5 w-5 transition-transform duration-base group-hover:translate-x-0.5" />
                </Link>
                <Link href="#how-it-works" className="btn-secondary btn-lg">See how it works</Link>
              </div>
              <ul className="fade-up mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted [animation-delay:300ms]">
                {["No card needed for the trial", `${price} per ${PLAN_PERIOD_DAYS} days after`, "No automatic charges"].map((t) => (
                  <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" />{t}</li>
                ))}
              </ul>
            </div>

            {/* Photo + illustrative product preview (static, not live data) */}
            <div className="fade-up relative mx-auto w-full max-w-md [animation-delay:200ms] lg:max-w-none">
              <Photo photo={PHOTOS.training} priority fade sizes="(min-width: 1024px) 560px, 92vw" className="aspect-[4/5] w-full shadow-elev-3 lg:aspect-[5/6]" />
              <div aria-hidden className="glass-card absolute -bottom-10 left-4 right-4 p-5 sm:left-auto sm:right-[-1.5rem] sm:w-[320px]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="eyebrow">Your first week</div>
                    <div className="mt-1 font-display text-lg font-semibold">3 sessions · 30 min</div>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-accent/80 text-xs font-semibold tabular-nums">2/3</div>
                </div>
                <ul className="mt-4 space-y-1.5">
                  {previewWeek.map((d) => (
                    <li key={d.day} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-[13px] ${d.today ? "border-accent/50 bg-accent/[0.08]" : "border-white/[0.06] bg-white/[0.02]"}`}>
                      <span className="w-8 text-[11px] font-semibold text-ink-subtle">{d.day}</span>
                      <span className={`flex-1 ${d.rest ? "text-ink-muted" : ""}`}>{d.title}</span>
                      {d.done && <Check className="h-3.5 w-3.5 text-accent" />}
                      {d.today && <span className="text-[11px] font-semibold text-accent">Today</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div aria-hidden className="glass-card absolute left-[-1rem] top-8 hidden items-center gap-3 px-4 py-3 sm:flex">
                <Flame className="h-5 w-5 text-accent" />
                <div>
                  <div className="text-[11px] text-ink-subtle">Streak</div>
                  <div className="font-display text-sm font-semibold tabular-nums">5 days</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── Problem ───────────── */}
        <section aria-labelledby="problem-title" className="mk-section border-t border-line">
          <div className="mk-shell">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
              <Reveal>
                <Kicker>The real problem</Kicker>
                <h2 id="problem-title" className="display-2 mt-6">
                  You&apos;re not short on discipline. You&apos;ve been handed <span className="serif-em text-accent">someone else&apos;s</span> plan.
                </h2>
                <p className="lede mt-6">
                  Starting again every Monday isn&apos;t a character flaw. Getting fit shouldn&apos;t mean giving up the food you grew up on or guessing your way through a programme alone.
                </p>
              </Reveal>
              <ol className="divide-y divide-white/[0.07] border-y border-line">
                {problems.map((p, i) => (
                  <Reveal as="li" key={p.title} delay={i * 0.08} className="flex gap-6 py-8">
                    <span className="font-display text-sm font-semibold tabular-nums text-ink-subtle">0{i + 1}</span>
                    <div>
                      <h3 className="display-3">{p.title}</h3>
                      <p className="mt-2 text-ink-muted">{p.body}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ───────────── Guide + Plan ───────────── */}
        <section id="how-it-works" aria-labelledby="plan-title" className="mk-section scroll-mt-20 bg-surface-1/60">
          <div className="mk-shell">
            <Reveal className="mx-auto max-w-3xl text-center">
              <Kicker center>How Drefit works</Kicker>
              <h2 id="plan-title" className="display-2 mt-6">
                A plan made for your life, and a coach who <span className="serif-em text-accent">stays.</span>
              </h2>
              <p className="lede mx-auto mt-6">
                We know a plan only works if it fits the week you actually have. So every Drefit plan starts with you, and your coach is a message away whenever it needs to bend.
              </p>
            </Reveal>
            <ol className="mt-16 grid gap-6 md:mt-20 md:grid-cols-3">
              {steps.map((s, i) => (
                <Reveal as="li" key={s.n} delay={i * 0.1} className="feature-card">
                  <span className="step-num">{s.n}</span>
                  <h3 className="display-3 mt-8">{s.title}</h3>
                  <p className="mt-3 text-ink-muted">{s.body}</p>
                </Reveal>
              ))}
            </ol>
            <Reveal className="mt-12 flex justify-center">
              <Link href="/register" className="btn-primary btn-lg group">
                Build my first week <ArrowRight className="h-5 w-5 transition-transform duration-base group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ───────────── Membership ("menu") ───────────── */}
        <section id="membership" aria-labelledby="membership-title" className="mk-section scroll-mt-20">
          <div className="mk-shell">
            <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <Kicker>Inside your membership</Kicker>
                <h2 id="membership-title" className="display-2 mt-6">Everything it takes. <span className="text-ink-muted">Nothing you&apos;ll pay extra for.</span></h2>
              </div>
              <p className="max-w-sm text-ink-muted">One membership unlocks all of it, from your first workout to your hundredth.</p>
            </Reveal>

            <div className="mt-16 grid gap-6 lg:grid-cols-12">
              {/* Feature: meal plans with photography */}
              <Reveal className="feature-card overflow-hidden p-0 md:p-0 lg:col-span-7 lg:row-span-2">
                <Photo photo={PHOTOS.meals} sizes="(min-width: 1024px) 640px, 92vw" className="aspect-[16/10] rounded-none rounded-t-3xl" />
                <div className="p-6 md:p-8">
                  <span className="icon-tile"><Salad className="h-4 w-4" /></span>
                  <h3 className="display-3 mt-6">Meal plans built on Nigerian food</h3>
                  <p className="mt-3 max-w-lg text-ink-muted">
                    Coach-designed plans with local recipes and portions that fit your goal, matched to how you eat: everything, vegetarian, keto/low-carb or halal. No imported ingredients you&apos;ll never find.
                  </p>
                </div>
              </Reveal>
              {included.slice(0, 2).map((f, i) => (
                <Reveal key={f.title} delay={0.08 * (i + 1)} className="feature-card lg:col-span-5">
                  <span className="icon-tile"><f.icon className="h-4 w-4" /></span>
                  <h3 className="display-3 mt-6">{f.title}</h3>
                  <p className="mt-3 text-ink-muted">{f.body}</p>
                </Reveal>
              ))}
              {included.slice(2).map((f, i) => (
                <Reveal key={f.title} delay={0.08 * i} className="feature-card lg:col-span-4">
                  <span className="icon-tile"><f.icon className="h-4 w-4" /></span>
                  <h3 className="display-3 mt-6">{f.title}</h3>
                  <p className="mt-3 text-ink-muted">{f.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────── Pricing ───────────── */}
        <section id="pricing" aria-labelledby="pricing-title" className="mk-section scroll-mt-20 border-t border-line">
          <div className="mk-shell grid items-center gap-16 lg:grid-cols-[1fr_1.05fr] lg:gap-24">
            <Reveal>
              <Kicker>Pricing</Kicker>
              <h2 id="pricing-title" className="display-2 mt-6">One membership. <span className="serif-em text-accent">Everything</span> included.</h2>
              <p className="lede mt-6">One clear price for a whole month of coaching, training and meal plans. No tiers, no upsells, no fine print.</p>
              <ul className="mt-10 space-y-5">
                {[
                  { icon: Gift, t: `${TRIAL_DAYS} days free, no card needed`, d: "Try every feature before you pay a kobo." },
                  { icon: ShieldCheck, t: "No automatic charges", d: `Each payment covers ${PLAN_PERIOD_DAYS} days. You decide when to renew.` },
                  { icon: Users, t: "Invite a friend, both get 30 days", d: "When a friend you invite makes their first payment, you each get 30 extra days." },
                ].map((r) => (
                  <li key={r.t} className="flex gap-4">
                    <span className="icon-tile mt-0.5"><r.icon className="h-4 w-4" /></span>
                    <div>
                      <div className="font-semibold text-ink">{r.t}</div>
                      <div className="mt-1 text-sm text-ink-muted">{r.d}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.1} className="glass-card overflow-hidden p-8 md:p-10">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent-fade" />
              <div className="flex items-center justify-between gap-3">
                <span className="whitespace-nowrap font-display text-lg font-semibold">Premium Monthly</span>
                <span className="chip-accent whitespace-nowrap">{TRIAL_DAYS}-day free trial</span>
              </div>
              <div className="mt-8 flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-[3.25rem] leading-none sm:text-6xl font-bold tabular-nums tracking-[-0.045em] md:text-7xl">{price}</span>
                <span className="whitespace-nowrap text-ink-muted">/ month</span>
              </div>
              <p className="mt-2 text-sm text-ink-subtle">{PLAN_PERIOD_DAYS} days of full access per payment, paid in naira through Paystack.</p>
              <ul className="mt-8 space-y-3 border-t border-line pt-8">
                {pricingPerks.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[15px]">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 text-accent"><Check className="h-3 w-3 icon-strong" /></span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="btn-primary btn-lg mt-10 w-full">Start your free trial</Link>
              <p className="mt-4 text-center text-xs text-ink-subtle">No card needed today. Cancel anytime.</p>
            </Reveal>
          </div>
        </section>

        {/* ───────────── Mission ───────────── */}
        <section id="mission" aria-labelledby="mission-title" className="mk-section scroll-mt-20 bg-surface-1/60">
          <div className="mk-shell grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <Reveal className="order-2 lg:order-1">
              <Photo photo={PHOTOS.running} sizes="(min-width: 1024px) 520px, 92vw" className="aspect-[4/5] w-full shadow-elev-3" />
            </Reveal>
            <div className="order-1 lg:order-2">
              <Reveal>
                <Kicker>Our mission</Kicker>
                <h2 id="mission-title" className="display-2 mt-6">
                  World-class coaching should feel personal, affordable and <span className="serif-em text-accent">unmistakably Nigerian.</span>
                </h2>
                <p className="lede mt-8">
                  Drefit exists so that getting strong, healthy and confident never depends on where you live, what you can afford or whether you can find quinoa. We build every plan around your goal, your schedule, your equipment and your kitchen, and we stay in your corner until the results show up, then we help you keep them.
                </p>
              </Reveal>
              <dl className="mt-12 grid gap-8 border-t border-line pt-10 sm:grid-cols-3">
                {[
                  { t: "Built for here", d: "Nigerian food, naira pricing and a plan that works on your network and your budget." },
                  { t: "Coached, not copied", d: "Workouts and meal plans are designed by coaches, then matched to you." },
                  { t: "Honest by default", d: "No hidden fees and no surprise renewals. You pay for the days you get." },
                ].map((v, i) => (
                  <Reveal key={v.t} delay={i * 0.08}>
                    <dt className="font-display text-base font-semibold text-ink">{v.t}</dt>
                    <dd className="mt-2 text-sm text-ink-muted">{v.d}</dd>
                  </Reveal>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ───────────── Stakes: success vs failure ───────────── */}
        <section aria-labelledby="stakes-title" className="mk-section">
          <div className="mk-shell">
            <Reveal className="mx-auto max-w-3xl text-center">
              <Kicker center>Picture three months from now</Kicker>
              <h2 id="stakes-title" className="display-2 mt-6">Another restart, or the start that <span className="serif-em text-accent">lasts?</span></h2>
            </Reveal>
            <div className="mt-16 grid gap-6 md:grid-cols-2">
              <Reveal className="rounded-3xl border border-line p-8 md:p-10">
                <div className="label-caps">Without a plan that fits</div>
                <ul className="mt-6 space-y-4">
                  {["Another Monday restart, another plan abandoned by Thursday", "Paying for a gym you don't go to", "Eating food you don't enjoy, then giving up on it", "Guessing, and never knowing if it's working"].map((t) => (
                    <li key={t} className="flex gap-3 text-ink-muted"><X className="mt-0.5 h-5 w-5 text-ink-subtle" />{t}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.1} className="relative overflow-hidden rounded-3xl border border-accent/30 bg-accent/[0.05] p-8 md:p-10">
                <div className="eyebrow">With Drefit</div>
                <ul className="mt-6 space-y-4">
                  {["A routine you can keep, on the days you can actually train", "Stronger, fitter and more energy for everything else", "Meals you look forward to, built on food you love", "Progress you can see in your photos, your trend line and your streak"].map((t) => (
                    <li key={t} className="flex gap-3 text-ink"><Check className="mt-0.5 h-5 w-5 text-accent" />{t}</li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ───────────── FAQ ───────────── */}
        <section id="faq" aria-labelledby="faq-title" className="mk-section scroll-mt-20 border-t border-line">
          <div className="mk-shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <Reveal>
              <Kicker>Questions</Kicker>
              <h2 id="faq-title" className="display-2 mt-6">Before you start</h2>
              <p className="mt-6 text-ink-muted">Anything else? Start your trial and ask your coach directly.</p>
            </Reveal>
            <Reveal delay={0.08} className="border-t border-line">
              {faqs.map((f) => (
                <details key={f.q} className="faq-item group">
                  <summary>
                    {f.q}
                    <span className="faq-icon grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong text-ink-muted group-open:border-accent/50 group-open:text-accent"><Plus className="h-4 w-4" /></span>
                  </summary>
                  <p className="-mt-2 max-w-prose pb-6 text-ink-muted">{f.a}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ───────────── Final CTA ───────────── */}
        <section className="pb-24 md:pb-32">
          <div className="mk-shell">
            <Reveal className="relative overflow-hidden rounded-[2rem] border border-accent/25 bg-surface-1 px-6 py-16 text-center md:px-16 md:py-24">
              <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/2 h-[380px] w-[720px] -translate-x-1/2 rounded-full bg-accent/[0.12] blur-[120px]" />
              <div className="relative">
                <h2 className="display-2 mx-auto max-w-3xl">Your first week is <span className="serif-em text-accent">six questions</span> away.</h2>
                <p className="lede mx-auto mt-6">Start free for {TRIAL_DAYS} days. No card, no catch. If it isn&apos;t for you, simply don&apos;t renew.</p>
                <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link href="/register" className="btn-primary btn-lg group">
                    Start your free trial <ArrowRight className="h-5 w-5 transition-transform duration-base group-hover:translate-x-0.5" />
                  </Link>
                  <Link href="/login" className="btn-secondary btn-lg">I already have an account <ArrowUpRight className="h-4 w-4" /></Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

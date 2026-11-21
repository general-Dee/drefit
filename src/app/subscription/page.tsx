"use client"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import Link from "next/link"
import { ArrowLeft, Check, CreditCard, Dumbbell, LineChart, Lock, MessageCircle, RefreshCw, Salad, ShieldCheck, Users, WifiOff } from "lucide-react"
import Logo from "@/components/ui/Logo"
import { PLAN_PRICE_NGN, PLAN_PERIOD_DAYS, TRIAL_DAYS } from "@/lib/paystack/plan"
import { accentFont } from "@/app/fonts"

import Spinner from "@/components/ui/Spinner"

export const dynamic = 'force-dynamic'

export default function SubscriptionPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [PaystackPop, setPaystackPop] = useState<any>(null)

  const periodEnd = session?.user?.subscriptionCurrentPeriodEnd
  const isRenewal =
    session?.user?.subscriptionStatus === "active" &&
    !!periodEnd &&
    new Date(periodEnd) <= new Date()

  useEffect(() => {
    import("@paystack/inline-js").then((mod) => setPaystackPop(() => mod.default))
  }, [])

  // Access is only granted server-side after Paystack's verify API confirms
  // the charge; the client callback alone never unlocks anything.
  const verifyPayment = useCallback(
    async (reference: string) => {
      setLoading(true)
      try {
        const res = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        })
        const result = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error(result.error || "We couldn't confirm your payment yet.")
          return
        }
        await update()
        toast.success("Payment confirmed. Welcome to Premium!")
        router.push("/dashboard")
        router.refresh()
      } finally {
        setLoading(false)
      }
    },
    [router, update]
  )

  // Redirect-flow fallback: Paystack returns to /subscription?reference=...
  useEffect(() => {
    if (status !== "authenticated") return
    const params = new URLSearchParams(window.location.search)
    const reference = params.get("reference") ?? params.get("trxref")
    if (reference) {
      window.history.replaceState(null, "", "/subscription")
      verifyPayment(reference)
    }
  }, [status, verifyPayment])

  const handleSubscribe = async () => {
    if (status !== "authenticated") {
      router.push("/login")
      return
    }
    if (!PaystackPop) {
      toast.error("Payment form is still loading, please try again.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/paystack/initialize", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.access_code) {
        toast.error(data.error || "Could not start checkout")
        setLoading(false)
        return
      }

      const paystack = new PaystackPop()
      paystack.resumeTransaction(data.access_code, {
        onSuccess: (tx: { reference?: string }) => verifyPayment(tx?.reference ?? data.reference),
        onCancel: () => setLoading(false),
        onError: (error: { message: string }) => {
          toast.error(error.message || "Payment failed")
          setLoading(false)
        },
      })
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong starting checkout")
      setLoading(false)
    }
  }

  const perks = [
    { icon: Dumbbell, t: "Personalised workout plans" },
    { icon: Salad, t: "Coach-designed Nigerian meal plans" },
    { icon: MessageCircle, t: "1-on-1 coaching chat" },
    { icon: LineChart, t: "Progress tracking: streaks, weight trend, photos" },
    { icon: Users, t: "Community feed and leaderboard" },
    { icon: WifiOff, t: "Offline workouts on your phone" },
  ]

  // Presentation only: wording adapts to the member's current state.
  const price = `₦${PLAN_PRICE_NGN.toLocaleString("en-NG")}`
  const signedIn = status === "authenticated"
  const hasTimeLeft =
    session?.user?.subscriptionStatus === "active" && !!periodEnd && new Date(periodEnd) > new Date()
  const endsOn = periodEnd
    ? new Date(periodEnd).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
    : null

  const title = isRenewal ? "Renew your membership" : hasTimeLeft ? `Add ${PLAN_PERIOD_DAYS} more days` : "Unlock Drefit Premium"
  const subtitle = isRenewal
    ? "Your last 30 days have ended. Renew to pick up exactly where you left off."
    : hasTimeLeft
      ? `You still have access${endsOn ? ` until ${endsOn}` : ""}. Renew now and the new ${PLAN_PERIOD_DAYS} days are added on top.`
      : `One payment, ${PLAN_PERIOD_DAYS} days of full access. Nothing renews automatically.`
  const cta = !signedIn ? "Sign in to continue" : `Pay ${price} securely`

  const next = [
    "Paystack opens a secure payment window. Pay with any option it offers you.",
    "We confirm the payment with Paystack. This usually takes a few seconds.",
    `Your ${PLAN_PERIOD_DAYS} days start and you're taken straight to your dashboard.`,
  ]

  return (
    <div className={`${accentFont.variable} relative min-h-[100dvh] overflow-x-clip`}>
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-accent/[0.08] blur-[120px]" />

      <header className="mk-shell relative flex h-16 items-center justify-between md:h-20">
        <Logo />
        <span className="chip"><Lock className="h-3.5 w-3.5 text-accent" /> Secure checkout</span>
      </header>

      <main className="mk-shell relative pb-20 pt-6 md:pb-28 md:pt-10">
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-md text-sm text-ink-muted transition-colors duration-base hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to Drefit
        </Link>

        <div className="fade-up mt-8 max-w-2xl">
          <div className="kicker">{isRenewal || hasTimeLeft ? "Renewal" : "Checkout"}</div>
          <h1 className="display-2 mt-5">{title}</h1>
          <p className="lede mt-4">{subtitle}</p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-8">
          {/* Order summary */}
          <section aria-labelledby="summary-title" className="fade-up order-2 rounded-3xl border border-line bg-surface-1/70 p-6 [animation-delay:80ms] sm:p-8 lg:order-1">
            <h2 id="summary-title" className="label-caps">Order summary</h2>
            <div className="mt-6 flex items-start justify-between gap-4">
              <div>
                <div className="font-display text-lg font-semibold">Drefit Premium</div>
                <div className="mt-1 text-sm text-ink-muted">{PLAN_PERIOD_DAYS} days of full access</div>
              </div>
              <div className="font-display text-lg font-semibold tabular-nums">{price}</div>
            </div>
            <ul className="mt-6 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
              {perks.map((p) => (
                <li key={p.t} className="flex items-center gap-3 text-sm">
                  <span className="icon-tile h-7 w-7 shrink-0 rounded-lg"><p.icon className="h-3.5 w-3.5" /></span>
                  {p.t}
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Subtotal</dt><dd className="tabular-nums">{price}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Renews</dt><dd>Only when you choose to</dd></div>
              <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
                <dt className="font-semibold text-ink">Total today</dt>
                <dd className="font-display text-2xl font-bold tabular-nums">{price}</dd>
              </div>
            </dl>
          </section>

          {/* Pay panel */}
          <section aria-labelledby="pay-title" className="glass-card fade-up order-1 overflow-hidden p-6 [animation-delay:140ms] sm:p-8 lg:order-2 lg:sticky lg:top-8">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent-fade" />
            <div className="flex items-center justify-between gap-3">
              <h2 id="pay-title" className="eyebrow">Premium membership</h2>
              <span className="chip whitespace-nowrap"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> Paystack</span>
            </div>
            <div className="mt-5 flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-5xl font-bold tabular-nums tracking-[-0.045em] sm:text-6xl">{price}</span>
              <span className="text-ink-muted">for {PLAN_PERIOD_DAYS} days</span>
            </div>

            <button onClick={handleSubscribe} disabled={loading || !PaystackPop} className="btn-primary btn-lg mt-8 w-full">
              {loading ? <><Spinner /> Processing</> : <>{signedIn && <Lock className="h-4 w-4" />}{cta}</>}
            </button>
            <p aria-live="polite" className="mt-3 min-h-[1.25rem] text-center text-xs text-ink-subtle">
              {loading
                ? "Keep this page open while we confirm with Paystack."
                : !PaystackPop
                  ? "Loading secure payment form…"
                  : signedIn
                    ? "You'll complete payment in Paystack's secure window."
                    : "Sign in to your Drefit account to pay."}
            </p>
            {!signedIn && status !== "loading" && (
              <p className="mt-4 text-center text-sm text-ink-muted">
                New to Drefit?{" "}
                <Link href="/register" className="font-medium text-accent underline-offset-4 hover:underline">Start your {TRIAL_DAYS}-day free trial</Link>
              </p>
            )}

            <ul className="mt-8 space-y-3 border-t border-line pt-6 text-sm">
              {[
                { icon: CreditCard, t: "Drefit never sees or stores your card details" },
                { icon: RefreshCw, t: "No automatic charges. Renew only when you want to" },
                { icon: Check, t: "Renew early and your remaining days carry over" },
              ].map((r) => (
                <li key={r.t} className="flex items-start gap-3 text-ink-muted">
                  <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {r.t}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* What happens next */}
        <section aria-labelledby="next-title" className="mt-16 border-t border-line pt-12">
          <h2 id="next-title" className="display-3">What happens <span className="serif-em text-accent">next</span></h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {next.map((t, i) => (
              <li key={t} className="flex gap-4">
                <span className="step-num shrink-0">0{i + 1}</span>
                <p className="pt-1.5 text-sm text-ink-muted">{t}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-xs text-ink-subtle">
            Payments are processed by Paystack in Nigerian naira. Your access starts only once Paystack confirms the payment. If a payment doesn&apos;t go through, you can simply try again.
          </p>
        </section>
      </main>
    </div>
  )
}

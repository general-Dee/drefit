"use client"
import { useEffect, useState } from "react"
import { CloudOff, Copy, Gift, Link2, MessageCircle, Send, UserPlus, Users } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import StatCard from "@/components/ui/StatCard"
import CountUp from "@/components/ui/CountUp"
import Skeleton from "@/components/ui/Skeleton"
import toast from "react-hot-toast"
import { buildWhatsAppShareLink } from "@/lib/whatsapp/coach-link"

export const dynamic = "force-dynamic"

interface ReferralInfo {
  code: string
  link: string
  signups: number
  rewardedReferrals: number
  rewardDaysEarned: number
  rewardDaysPerReferral: number
}

export default function ReferralsPage() {
  const [info, setInfo] = useState<ReferralInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/referrals")
      .then((res) => (res.ok ? res.json() : null))
      .then(setInfo)
      .finally(() => setLoading(false))
  }, [])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied")
    } catch {
      toast.error("Could not copy")
    }
  }

  const shareText = info
    ? `Train with me on Aremo — coach-designed workouts and Nigerian meal plans. Sign up with my link and we both get ${info.rewardDaysPerReferral} extra days: ${info.link}`
    : ""

  return (
    <div className="page-shell max-w-2xl">
      <PageHeader
        eyebrow="Invite"
        title="Invite friends, train free"
        subtitle={<>When a friend joins with your link and makes their first payment, you both get <span className="font-semibold text-ink tabular-nums">{info?.rewardDaysPerReferral ?? 30}</span> extra days of Premium.</>}
      />

      {loading ? (
        <ReferralsBodySkeleton />
      ) : !info ? (
        <div className="glass-card">
          <EmptyState icon={CloudOff} title="Couldn't load your invite details" description="Check your connection and try again." action={{ label: "Try again", onClick: () => window.location.reload() }} />
        </div>
      ) : (
        <div className="space-y-4">
          <section className="glass-card overflow-hidden p-5 sm:p-6">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent-fade" />
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative">
              <div className="label-caps">Your code</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="font-display text-[2rem] font-bold leading-none tracking-[0.12em] text-accent tabular-nums" data-testid="referral-code">{info.code}</span>
                <button onClick={() => copy(info.code)} className="btn-ghost btn-sm" aria-label="Copy code">
                  <Copy className="h-4 w-4" /> Copy
                </button>
              </div>
              <div className="label-caps mt-5">Your link</div>
              <div className="mt-2 flex items-center gap-2">
                <input readOnly value={info.link} aria-label="Your invite link" className="input-field min-w-0 flex-1 truncate text-sm text-ink-muted" />
                <button onClick={() => copy(info.link)} className="btn-secondary shrink-0" aria-label="Copy link">
                  <Link2 className="h-4 w-4" /> <span className="hidden sm:inline">Copy link</span>
                </button>
              </div>
              <a href={buildWhatsAppShareLink(shareText)} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 w-full">
                <MessageCircle className="h-4 w-4" /> Share on WhatsApp
              </a>
            </div>
          </section>

          <div className="stagger grid grid-cols-2 gap-3 md:gap-4">
            <StatCard icon={Users} label="Friends joined">
              <CountUp value={info.signups} />
            </StatCard>
            <StatCard icon={Gift} label="Rewards earned" hint={`${info.rewardedReferrals} rewarded referral${info.rewardedReferrals === 1 ? "" : "s"}`}>
              <CountUp value={info.rewardDaysEarned} /><span className="stat-unit">days</span>
            </StatCard>
          </div>

          {info.signups === 0 && (
            <div className="glass-card">
              <EmptyState compact icon={UserPlus} title="No friends invited yet" description="Share your link. Rewards land as soon as their first payment goes through." />
            </div>
          )}

          <ol className="glass-card grid gap-4 p-5 sm:grid-cols-3">
            {[
              { icon: Send, t: "Share your link", d: "Send it on WhatsApp or anywhere." },
              { icon: UserPlus, t: "Friend joins", d: "They sign up with your code." },
              { icon: Gift, t: "You both win", d: "Extra Premium days after their first payment." },
            ].map((step, i) => (
              <li key={step.t} className="flex gap-3 sm:flex-col">
                <span className="icon-tile-muted"><step.icon className="h-4 w-4" /></span>
                <div>
                  <div className="text-sm font-semibold"><span className="mr-1 text-ink-subtle tabular-nums">{i + 1}.</span>{step.t}</div>
                  <p className="mt-0.5 text-xs text-ink-muted">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function ReferralsBodySkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-[244px] w-full" />
      <div className="grid grid-cols-2 gap-3 md:gap-4"><Skeleton className="h-[104px]" /><Skeleton className="h-[104px]" /></div>
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import { Copy, Gift, Users, MessageCircle } from "lucide-react"
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
    ? `Train with me on Drefit — coach-designed workouts and Nigerian meal plans. Sign up with my link and we both get ${info.rewardDaysPerReferral} extra days: ${info.link}`
    : ""

  return (
    <div className="page-shell max-w-2xl space-y-6">
      <h1 className="fade-up font-bold">Invite friends</h1>
      <p className="text-ink-muted">
        When a friend joins with your link and makes their first payment, you both get {info?.rewardDaysPerReferral ?? 30} extra days of Premium.
      </p>

      {loading ? (
        <div className="skeleton p-4 h-40" />
      ) : !info ? (
        <div className="glass-card p-4 text-ink-muted">Could not load your referral details. Please try again.</div>
      ) : (
        <>
          <div className="glass-card p-4 space-y-3">
            <div className="text-sm text-ink-muted">Your code</div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-3xl font-bold tracking-widest text-drefit-lime" data-testid="referral-code">{info.code}</span>
              <button onClick={() => copy(info.code)} className="flex items-center gap-1 text-sm text-gray-300 hover:text-white">
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
            <div className="text-sm text-ink-muted">Your link</div>
            <div className="flex items-center gap-2">
              <input readOnly value={info.link} className="input-field flex-1 py-2.5 text-sm" />
              <button onClick={() => copy(info.link)} className="btn-secondary px-4 py-2.5">
                Copy link
              </button>
            </div>
            <a
              href={buildWhatsAppShareLink(shareText)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-4 py-2.5"
            >
              <MessageCircle className="w-4 h-4" /> Share on WhatsApp
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Users className="w-4 h-4 text-drefit-lime" /> Friends joined
              </div>
              <div className="stat-value mt-1">{info.signups}</div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Gift className="w-4 h-4 text-drefit-lime" /> Rewards earned
              </div>
              <div className="stat-value mt-1">{info.rewardDaysEarned} days</div>
              <div className="text-xs text-ink-subtle">{info.rewardedReferrals} rewarded referral{info.rewardedReferrals === 1 ? "" : "s"}</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

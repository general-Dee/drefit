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
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-3xl">Invite friends</h1>
      <p className="text-gray-400">
        When a friend joins with your link and makes their first payment, you both get {info?.rewardDaysPerReferral ?? 30} extra days of Premium.
      </p>

      {loading ? (
        <div className="glass-card p-4 h-40 animate-pulse" />
      ) : !info ? (
        <div className="glass-card p-4 text-gray-400">Could not load your referral details. Please try again.</div>
      ) : (
        <>
          <div className="glass-card p-4 space-y-3">
            <div className="text-sm text-gray-400">Your code</div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-3xl font-bold tracking-widest text-drefit-lime" data-testid="referral-code">{info.code}</span>
              <button onClick={() => copy(info.code)} className="flex items-center gap-1 text-sm text-gray-300 hover:text-white">
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
            <div className="text-sm text-gray-400">Your link</div>
            <div className="flex items-center gap-2">
              <input readOnly value={info.link} className="flex-1 bg-white/5 border border-white/10 rounded p-2 text-sm" />
              <button onClick={() => copy(info.link)} className="bg-white/10 px-3 py-2 rounded text-sm">
                Copy link
              </button>
            </div>
            <a
              href={buildWhatsAppShareLink(shareText)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 font-semibold text-black hover:opacity-90"
            >
              <MessageCircle className="w-4 h-4" /> Share on WhatsApp
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="w-4 h-4 text-drefit-lime" /> Friends joined
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{info.signups}</div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Gift className="w-4 h-4 text-drefit-lime" /> Rewards earned
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{info.rewardDaysEarned} days</div>
              <div className="text-xs text-gray-500">{info.rewardedReferrals} rewarded referral{info.rewardedReferrals === 1 ? "" : "s"}</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

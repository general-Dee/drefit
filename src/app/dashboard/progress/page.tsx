"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Area, Line } from "recharts"
import { Camera, ImagePlus, Info, LineChart, Scale, Flame, Trophy, TrendingDown, TrendingUp } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import StatCard from "@/components/ui/StatCard"
import CountUp from "@/components/ui/CountUp"
import Spinner from "@/components/ui/Spinner"
import { ProgressSkeleton } from "@/components/ui/skeletons"
import { reveal } from "@/components/ui/motion"
import { format } from "date-fns"
import toast from "react-hot-toast"
import type { WeightSummary, Streaks } from "@/lib/progress"

export const dynamic = "force-dynamic"

interface PhotoItem {
  id: string
  fileId: string
  takenAt: string
}

interface Summary {
  weight: WeightSummary
  photos: PhotoItem[]
  streaks: Streaks
  totalWorkouts: number
}

const photoUrl = (fileId: string) => `/api/progress/photos/${fileId}`

function signed(v: number | null, unit: string) {
  if (v == null) return "—"
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}${unit}`
}

export default function ProgressPage() {
  const [data, setData] = useState<Summary | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [showWeightForm, setShowWeightForm] = useState(false)
  const [weightInput, setWeightInput] = useState("")
  const [savingWeight, setSavingWeight] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [beforeId, setBeforeId] = useState<string | null>(null)
  const [afterId, setAfterId] = useState<string | null>(null)
  const [split, setSplit] = useState(50)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    const res = await fetch("/api/progress/summary")
    if (!res.ok) return
    const summary: Summary = await res.json()
    setData(summary)
    if (summary.photos.length >= 1) {
      setBeforeId((cur) => cur ?? summary.photos[0].id)
      setAfterId((cur) => cur ?? summary.photos[summary.photos.length - 1].id)
    }
  }, [])

  useEffect(() => {
    loadData().finally(() => setLoadingData(false))
  }, [loadData])

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault()
    const weight = parseFloat(weightInput)
    if (!weight || weight <= 0) {
      toast.error("Enter a valid weight")
      return
    }
    setSavingWeight(true)
    try {
      const res = await fetch("/api/progress/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.error || "Could not save weight entry")
        return
      }
      toast.success("Weight logged")
      setWeightInput("")
      setShowWeightForm(false)
      await loadData()
    } finally {
      setSavingWeight(false)
    }
  }

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/progress/photos", { method: "POST", body: formData })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.error || "Could not upload photo")
        return
      }
      toast.success("Photo uploaded")
      setAfterId(null)
      await loadData()
    } finally {
      setUploadingPhoto(false)
    }
  }

  const chartData = useMemo(
    () => (data?.weight.points ?? []).map((p) => ({ day: format(new Date(p.date), "MMM d"), weight: p.weight, trend: p.trend })),
    [data]
  )
  const photos = data?.photos ?? []
  const before = photos.find((p) => p.id === beforeId)
  const after = photos.find((p) => p.id === afterId)
  const w = data?.weight
  const trendDown = (w?.trendKgPerWeek ?? 0) < 0

  const streak = data?.streaks.current ?? 0
  const openWeightForm = () => setShowWeightForm(true)
  const pickPhoto = () => fileInputRef.current?.click()

  if (loadingData && !data) return <ProgressSkeleton />

  return (
    <div className="page-shell space-y-4 md:space-y-6">
      <PageHeader
        eyebrow="Progress"
        title="Your progress"
        subtitle="Streaks, weight trend and before/after photos."
        action={
          <button onClick={() => setShowWeightForm((v) => !v)} aria-expanded={showWeightForm} className="btn-primary">
            <Scale className="h-4 w-4" /> Log weight
          </button>
        }
      />

      <AnimatePresence initial={false}>
        {showWeightForm && (
          <motion.form {...reveal} onSubmit={handleLogWeight} className="glass-card flex items-end gap-3 p-4">
            <label className="min-w-0 flex-1">
              <span className="field-label">Today&apos;s weight</span>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="e.g. 82.4"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="input-field pr-12 tabular-nums"
                  required
                  autoFocus
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">kg</span>
              </div>
            </label>
            <button type="button" onClick={() => setShowWeightForm(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={savingWeight} className="btn-primary w-[96px]">
              {savingWeight ? <Spinner /> : "Save"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="stagger grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" data-testid="progress-stats">
        <StatCard icon={Flame} label="Current streak" hint={data && streak === 0 ? "No streak yet. Train today." : undefined}>
          {data ? <><CountUp value={streak} /><span className="stat-unit">day{streak === 1 ? "" : "s"}</span></> : "—"}
        </StatCard>
        <StatCard icon={Trophy} label="Best streak">
          {data ? <><CountUp value={data.streaks.best} /><span className="stat-unit">day{data.streaks.best === 1 ? "" : "s"}</span></> : "—"}
        </StatCard>
        <StatCard icon={Scale} label="Change since start">
          {w?.changeKg == null ? <span className="text-ink-subtle">—</span> : <><CountUp value={w.changeKg} decimals={1} prefix={w.changeKg > 0 ? "+" : ""} /><span className="stat-unit">kg</span></>}
        </StatCard>
        <StatCard icon={trendDown ? TrendingDown : TrendingUp} label="Trend">
          {w?.trendKgPerWeek == null ? <span className="text-ink-subtle">—</span> : <><CountUp value={w.trendKgPerWeek} decimals={1} prefix={w.trendKgPerWeek > 0 ? "+" : ""} /><span className="stat-unit">kg/wk</span></>}
        </StatCard>
      </div>

      <section className="glass-card fade-up p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2>Weight</h2>
          {w?.latestWeight != null && (
            <span className="text-sm tabular-nums text-ink-muted">
              Start {w.startWeight?.toFixed(1)} kg <span className="text-ink-subtle">→</span> now <span className="font-semibold text-ink">{w.latestWeight.toFixed(1)} kg</span>
            </span>
          )}
        </div>
        {chartData.length === 0 ? (
          <div className="grid h-72 place-items-center">
            <EmptyState compact icon={LineChart} title="No weight logged yet" description="Log your first weigh-in to start your trend line." action={{ label: "Log weight", onClick: openWeightForm, variant: "secondary" }} />
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C8F135" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#C8F135" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#8B8B94" tickLine={false} axisLine={false} fontSize={12} tickMargin={8} minTickGap={24} />
                <YAxis stroke="#8B8B94" tickLine={false} axisLine={false} fontSize={12} width={36} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "#1F1F23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#F5F5F4", boxShadow: "0 16px 40px -12px rgba(0,0,0,0.8)", fontSize: 13 }}
                  labelStyle={{ color: "#A1A1AA", marginBottom: 4 }}
                  cursor={{ stroke: "rgba(200,241,53,0.35)", strokeDasharray: "3 3" }}
                />
                <Area type="monotone" dataKey="weight" name="Weight (kg)" stroke="#C8F135" strokeWidth={2.25} fill="url(#weightFill)" isAnimationActive={false} activeDot={{ r: 5, fill: "#C8F135", stroke: "#0A0A0B", strokeWidth: 2 }} dot={false} />
                {chartData.length >= 2 && (
                  <Line type="linear" dataKey="trend" name="Trend" stroke="rgba(245,245,244,0.5)" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />

      <section className="glass-card fade-up p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2>Before &amp; after</h2>
          <button onClick={pickPhoto} disabled={uploadingPhoto} className="btn-secondary btn-sm w-[132px]">
            {uploadingPhoto ? <Spinner /> : <Camera className="h-4 w-4" />} {uploadingPhoto ? "Uploading" : "Upload photo"}
          </button>
        </div>
        {photos.length === 0 ? (
          <EmptyState compact icon={ImagePlus} title="No progress photos yet" description="Snap one today. Future you will want the comparison." action={{ label: "Upload first photo", onClick: pickPhoto, variant: "secondary" }} />
        ) : (
          <div className="space-y-5">
            {before && after && before.id !== after.id ? (
              <div className="space-y-3">
                <div className="relative mx-auto aspect-[3/4] w-full max-w-sm select-none overflow-hidden rounded-2xl border border-line shadow-elev-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(after.fileId)} alt="After" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl(before.fileId)} alt="Before" className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute inset-y-0 w-0.5 bg-accent shadow-[0_0_12px_rgba(200,241,53,0.8)]" style={{ left: `${split}%` }} />
                  <span className="chip absolute left-2 top-2 border-white/10 bg-black/60 text-ink">Before · {format(new Date(before.takenAt), "MMM d")}</span>
                  <span className="chip absolute right-2 top-2 border-white/10 bg-black/60 text-ink">After · {format(new Date(after.takenAt), "MMM d")}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={split}
                  onChange={(e) => setSplit(Number(e.target.value))}
                  className="mx-auto block w-full max-w-sm"
                  aria-label="Before/after slider"
                />
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink-muted"><Info className="h-4 w-4" /> Upload at least two photos to compare before and after.</p>
            )}

            <div>
              <p className="mb-3 text-sm text-ink-muted">Timeline: tap Before or After to compare.</p>
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
                {photos.map((photo) => {
                  const sel = photo.id === beforeId || photo.id === afterId
                  return (
                    <div key={photo.id} className="w-24 shrink-0 text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl(photo.fileId)}
                        alt={`Progress photo ${format(new Date(photo.takenAt), "MMM d")}`}
                        className={`h-24 w-24 rounded-xl object-cover ring-2 transition-shadow duration-base ${sel ? "ring-accent" : "ring-transparent"}`}
                      />
                      <p className="mt-1.5 text-xs tabular-nums text-ink-muted">{format(new Date(photo.takenAt), "MMM d, yyyy")}</p>
                      <div className="mt-1.5 flex justify-center gap-1 text-[11px] font-medium">
                        <button onClick={() => setBeforeId(photo.id)} className={`pressable rounded-md px-2 py-1 ${photo.id === beforeId ? "lime-gradient" : "bg-white/[0.07] text-ink-muted hover:text-ink"}`}>
                          Before
                        </button>
                        <button onClick={() => setAfterId(photo.id)} className={`pressable rounded-md px-2 py-1 ${photo.id === afterId ? "lime-gradient" : "bg-white/[0.07] text-ink-muted hover:text-ink"}`}>
                          After
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

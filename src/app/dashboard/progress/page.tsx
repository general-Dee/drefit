"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Area, Line } from "recharts"
import { Camera, Scale, Flame, Trophy, TrendingDown, TrendingUp } from "lucide-react"
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

  return (
    <div className="page-shell space-y-6">
      <h1 className="fade-up font-bold">Progress</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="progress-stats">
        <StatCard icon={<Flame className="text-drefit-lime" />} label="Current streak" value={data ? `${data.streaks.current} day${data.streaks.current === 1 ? "" : "s"}` : "—"} />
        <StatCard icon={<Trophy className="text-drefit-lime" />} label="Best streak" value={data ? `${data.streaks.best} day${data.streaks.best === 1 ? "" : "s"}` : "—"} />
        <StatCard icon={<Scale className="text-drefit-lime" />} label="Change since start" value={signed(w?.changeKg ?? null, " kg")} />
        <StatCard
          icon={trendDown ? <TrendingDown className="text-drefit-lime" /> : <TrendingUp className="text-drefit-lime" />}
          label="Trend"
          value={w?.trendKgPerWeek == null ? "—" : `${signed(w.trendKgPerWeek, " kg")}/wk`}
        />
      </div>

      <div className="glass-card p-4">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-lg">Weight</h2>
          {w?.latestWeight != null && (
            <span className="text-sm text-ink-muted">
              Start {w.startWeight?.toFixed(1)} kg → now {w.latestWeight.toFixed(1)} kg
            </span>
          )}
        </div>
        <div className="h-72 flex items-center justify-center">
          {loadingData ? (
            <p className="text-ink-muted">Loading...</p>
          ) : chartData.length === 0 ? (
            <p className="text-ink-muted">No weight logged yet — add your first entry below.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <XAxis dataKey="day" stroke="#8B8B94" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke="#8B8B94" tickLine={false} axisLine={false} fontSize={12} width={36} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "#18181B", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#F5F5F4" }} labelStyle={{ color: "#A1A1AA" }} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
                <Area type="monotone" dataKey="weight" name="Weight (kg)" stroke="#C8F135" fill="#C8F135" fillOpacity={0.2} />
                {chartData.length >= 2 && (
                  <Line type="linear" dataKey="trend" name="Trend" stroke="#ffffff" strokeDasharray="5 5" dot={false} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button onClick={() => setShowWeightForm((v) => !v)} className="glass-card card-interactive p-4 flex items-center gap-3">
          <Scale className="text-drefit-lime" /> Log Weight
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingPhoto}
          className="glass-card card-interactive p-4 flex items-center gap-3 disabled:opacity-50"
        >
          <Camera className="text-drefit-lime" /> {uploadingPhoto ? "Uploading..." : "Upload Photo"}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />
      </div>

      {showWeightForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleLogWeight}
          className="glass-card p-4 flex items-center gap-3"
        >
          <input
            type="number"
            step="0.1"
            placeholder="Weight (kg)"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="input-field flex-1"
            required
          />
          <button type="submit" disabled={savingWeight} className="btn-primary">
            {savingWeight ? "Saving..." : "Save"}
          </button>
        </motion.form>
      )}

      {photos.length > 0 && (
        <div className="glass-card p-4 space-y-4">
          <h2 className="text-lg">Before &amp; after</h2>
          {before && after && before.id !== after.id ? (
            <div className="space-y-2">
              <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-lg select-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl(after.fileId)} alt="After" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(before.fileId)} alt="Before" className="h-full w-full object-cover" />
                </div>
                <div className="absolute inset-y-0 w-0.5 bg-drefit-lime" style={{ left: `${split}%` }} />
                <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs">Before · {format(new Date(before.takenAt), "MMM d")}</span>
                <span className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs">After · {format(new Date(after.takenAt), "MMM d")}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={split}
                onChange={(e) => setSplit(Number(e.target.value))}
                className="mx-auto block w-full max-w-sm accent-[#C8F135]"
                aria-label="Before/after slider"
              />
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Upload at least two photos to compare before and after.</p>
          )}

          <div>
            <p className="text-sm text-ink-muted mb-2">Timeline — tap a photo to set it as before or after.</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((photo) => (
                <div key={photo.id} className="shrink-0 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl(photo.fileId)}
                    alt={`Progress photo ${format(new Date(photo.takenAt), "MMM d")}`}
                    className={`w-24 h-24 object-cover rounded border-2 ${
                      photo.id === beforeId || photo.id === afterId ? "border-drefit-lime" : "border-transparent"
                    }`}
                  />
                  <p className="text-xs text-ink-muted mt-1">{format(new Date(photo.takenAt), "MMM d, yyyy")}</p>
                  <div className="mt-1 flex justify-center gap-1 text-[10px]">
                    <button onClick={() => setBeforeId(photo.id)} className={`rounded px-1.5 py-0.5 ${photo.id === beforeId ? "bg-accent text-accent-ink" : "bg-white/10"}`}>
                      Before
                    </button>
                    <button onClick={() => setAfterId(photo.id)} className={`rounded px-1.5 py-0.5 ${photo.id === afterId ? "bg-accent text-accent-ink" : "bg-white/10"}`}>
                      After
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        {icon} {label}
      </div>
      <div className="stat-value mt-1">{value}</div>
    </div>
  )
}

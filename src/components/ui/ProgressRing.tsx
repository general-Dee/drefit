"use client"
import { useId } from "react"
import { motion } from "framer-motion"

// Circular progress. The arc is drawn statically; the ring animates in with
// opacity/scale only (transform + opacity), and MotionConfig honours
// prefers-reduced-motion.
export default function ProgressRing({ value, max, size = 64, stroke = 6, label }: { value: number; max: number; size?: number; stroke?: number; label?: React.ReactNode }) {
  const gid = `ring-${useId().replace(/:/g, "")}`
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: -30 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value} of ${max}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#DDFB72" />
            <stop offset="100%" stopColor="#B1E01F" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      {label && <div className="absolute inset-0 grid place-items-center text-xs font-semibold tabular-nums">{label}</div>}
    </motion.div>
  )
}

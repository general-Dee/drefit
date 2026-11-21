"use client"
import { useEffect, useRef, useState } from "react"

// Animated number (text only, no layout work). Jumps straight to the value
// when the user prefers reduced motion.
export default function CountUp({ value, duration = 900, decimals = 0, prefix = "", suffix = "" }: { value: number; duration?: number; decimals?: number; prefix?: string; suffix?: string }) {
  const [shown, setShown] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduce || duration <= 0) {
      setShown(value)
      from.current = value
      return
    }
    const start = performance.now()
    const startVal = from.current
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(startVal + (value - startVal) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return (
    <span className="tabular-nums">
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  )
}

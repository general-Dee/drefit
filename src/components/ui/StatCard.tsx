import type { LucideIcon } from "lucide-react"
import Skeleton from "./Skeleton"

// Stat tile: icon tile + label, then a large tabular number. Children render
// the value (usually <CountUp/> plus a .stat-unit span).
export default function StatCard({
  icon: Icon,
  label,
  loading = false,
  children,
  hint,
}: {
  icon: LucideIcon
  label: string
  loading?: boolean
  children: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div className="glass-card min-w-0 p-4">
      <div className="flex items-center gap-2.5">
        <span className="icon-tile h-8 w-8 rounded-lg"><Icon className="h-4 w-4" /></span>
        <span className="stat-label truncate">{label}</span>
      </div>
      <div className="stat-value mt-3 truncate">{loading ? <Skeleton className="h-8 w-20 rounded-lg" /> : children}</div>
      {hint && <div className="mt-1 truncate text-xs text-ink-subtle">{hint}</div>}
    </div>
  )
}

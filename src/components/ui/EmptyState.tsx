import Link from "next/link"
import type { LucideIcon } from "lucide-react"

type Action = { label: string; href?: string; onClick?: () => void; variant?: "primary" | "secondary" }

// Designed empty state: icon tile with a soft halo, title, helpful line, CTA.
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondary,
  compact = false,
  className = "",
}: {
  icon: LucideIcon
  title: string
  description?: React.ReactNode
  action?: Action
  secondary?: Action
  compact?: boolean
  className?: string
}) {
  const renderAction = (a: Action, primary: boolean) => {
    const cls = !primary ? "btn-ghost btn-sm" : a.variant === "secondary" ? "btn-secondary btn-sm" : "btn-primary btn-sm"
    return a.href ? (
      <Link href={a.href} className={cls}>{a.label}</Link>
    ) : (
      <button type="button" onClick={a.onClick} className={cls}>{a.label}</button>
    )
  }
  return (
    <div
      data-testid="empty-state"
      className={`fade-up flex flex-col items-center text-center ${compact ? "px-4 py-8" : "px-6 py-12 sm:py-16"} ${className}`}
    >
      <div className="relative mb-5">
        <div aria-hidden className="absolute inset-0 -z-10 scale-150 rounded-full bg-accent/10 blur-2xl" />
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-line-strong bg-surface-3 text-accent shadow-elev-2">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-sm text-ink-muted">{description}</p>}
      {(action || secondary) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action && renderAction(action, true)}
          {secondary && renderAction(secondary, false)}
        </div>
      )}
    </div>
  )
}

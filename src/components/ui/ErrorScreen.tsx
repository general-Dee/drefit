import Link from "next/link"
import { RotateCcw, LifeBuoy, type LucideIcon } from "lucide-react"
import Logo from "./Logo"

// Full-screen designed error/not-found state. Purely presentational.
export default function ErrorScreen({
  icon: Icon,
  code,
  title,
  description,
  onRetry,
  homeHref = "/dashboard",
  homeLabel = "Back to dashboard",
  digest,
}: {
  icon: LucideIcon
  code?: string
  title: string
  description: string
  onRetry?: () => void
  homeHref?: string
  homeLabel?: string
  digest?: string
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 py-12">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[110px]" />
      <Logo className="relative mb-10" />
      <div className="glass-card fade-up relative w-full max-w-md overflow-hidden p-6 text-center sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent-fade" />
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-line-strong bg-surface-3 text-accent shadow-elev-2">
          <Icon className="h-6 w-6" />
        </div>
        {code && <div className="label-caps mb-2 tabular-nums">{code}</div>}
        <h1 className="text-2xl sm:text-[1.75rem]">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink-muted">{description}</p>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {onRetry && (
            <button onClick={onRetry} className="btn-primary">
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
          )}
          <Link href={homeHref} className={onRetry ? "btn-secondary" : "btn-primary"}>
            {homeLabel}
          </Link>
        </div>
        {digest && <p className="mt-5 text-[11px] tabular-nums text-ink-subtle">Ref: {digest}</p>}
      </div>
      <a href="/dashboard/coaching" className="relative mt-6 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors duration-base hover:text-ink">
        <LifeBuoy className="h-4 w-4" /> Still stuck? Message your coach
      </a>
    </div>
  )
}

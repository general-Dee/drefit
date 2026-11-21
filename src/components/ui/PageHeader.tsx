import Link from "next/link"
import { ArrowLeft } from "lucide-react"

// Page title block: optional back link, eyebrow, title, subtitle and one
// primary action on the right (wraps under the title on phones).
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  back,
}: {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  back?: { href: string; label: string }
}) {
  return (
    <header className="fade-up mb-6 md:mb-8">
      {back && (
        <Link href={back.href} className="pressable -ml-1 mb-4 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-ink-muted transition-colors duration-base hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 sm:flex-1">
          {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
          <h1 className="break-words">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-xl text-[15px] text-ink-muted">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
    </header>
  )
}

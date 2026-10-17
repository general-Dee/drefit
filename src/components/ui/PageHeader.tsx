export default function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <header className="fade-up mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="mt-1 text-ink-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </header>
  )
}

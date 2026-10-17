import Logo from "@/components/ui/Logo"

// Shared full-screen frame for auth/pricing screens: logo, soft accent glow,
// glass card. Purely presentational.
export default function AuthShell({ title, subtitle, children, footer, center = false }: { title: React.ReactNode; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; center?: boolean }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]" />
      <Logo className="relative mb-8" />
      <div className={`glass-card fade-up relative w-full max-w-md p-6 sm:p-8 ${center ? "text-center" : ""}`}>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-ink-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="relative mt-6 text-sm text-ink-muted">{footer}</div>}
    </div>
  )
}

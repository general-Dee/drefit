import Link from "next/link"
import Logo from "@/components/ui/Logo"

const cols = [
  { title: "Drefit", links: [{ href: "/#how-it-works", label: "How it works" }, { href: "/#membership", label: "Membership" }, { href: "/#pricing", label: "Pricing" }, { href: "/#mission", label: "Our mission" }] },
  { title: "Members", links: [{ href: "/register", label: "Start free trial" }, { href: "/login", label: "Sign in" }, { href: "/subscription", label: "Renew membership" }, { href: "/#faq", label: "FAQ" }] },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface-0">
      <div className="mk-shell grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-ink-muted">
            Coach-designed training and Nigerian meal plans, built around the life you actually live.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div className="label-caps">{c.title}</div>
            <ul className="mt-4 space-y-1">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-[36px] items-center text-sm text-ink-muted transition-colors hover:text-ink">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mk-shell flex flex-col gap-2 border-t border-line py-6 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Drefit. Made in Nigeria.</span>
        <span>Payments processed securely by Paystack.</span>
      </div>
    </footer>
  )
}

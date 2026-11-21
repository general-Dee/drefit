"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import Logo from "@/components/ui/Logo"

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#membership", label: "Membership" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#mission", label: "Mission" },
  { href: "/#faq", label: "FAQ" },
]

// Sticky marketing nav: transparent over the hero, a solid hairline bar once
// the page scrolls. Mobile gets a full-width sheet.
export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color] duration-slow ${
        scrolled || open ? "bar-blur border-line" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mk-shell flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">Sign in</Link>
          <Link href="/register" className="btn-primary btn-sm hidden px-4 sm:inline-flex">Start free trial</Link>
          <button
            type="button"
            className="icon-btn lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="mk-shell animate-fade-in pb-6 lg:hidden">
          <ul className="divide-y divide-white/[0.06] border-t border-line">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="flex min-h-[52px] items-center font-display text-lg font-semibold text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href="/login" className="btn-secondary">Sign in</Link>
            <Link href="/register" className="btn-primary">Start free trial</Link>
          </div>
        </nav>
      )}
    </header>
  )
}

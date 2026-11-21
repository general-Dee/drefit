import Link from "next/link"

export default function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight ${className}`}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-ink">A</span>
      Aremo
    </Link>
  )
}

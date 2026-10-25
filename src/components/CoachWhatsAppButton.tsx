"use client"
import { MessageCircle } from "lucide-react"
import { buildCoachWhatsAppLink } from "@/lib/whatsapp/coach-link"
import { getCoachWhatsAppNumber } from "@/lib/whatsapp/coach-number"

// Uses NEXT_PUBLIC_COACH_WHATSAPP, falling back to the default coach line.
export default function CoachWhatsAppButton({ className = "" }: { className?: string }) {
  const href = buildCoachWhatsAppLink(getCoachWhatsAppNumber(process.env.NEXT_PUBLIC_COACH_WHATSAPP), "Hi coach, I'm messaging from Aremo.")
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-secondary px-4 py-2.5 ${className}`}
    >
      <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden /> Chat with your coach
    </a>
  )
}

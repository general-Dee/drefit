"use client"
import { motion } from "framer-motion"
import { EASE_OUT } from "@/components/ui/motion"

// Fade-and-rise on first scroll into view. Transform/opacity only;
// MotionConfig reducedMotion="user" (providers.tsx) drops the movement.
export default function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
  as = "div",
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
  as?: "div" | "li" | "section" | "article"
}) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
    >
      {children}
    </Tag>
  )
}

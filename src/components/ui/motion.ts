// Motion tokens for framer-motion (mirror the CSS vars in globals.css).
// Only transform/opacity are animated; MotionConfig reducedMotion="user"
// turns transforms off for people who prefer reduced motion.
export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const
export const DUR = { fast: 0.12, base: 0.2, slow: 0.32, slower: 0.52 } as const
export const SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: DUR.slow, ease: EASE_OUT },
}

// Accordion / sheet content: opacity + translate (height snaps, no layout animation)
export const reveal = {
  initial: { opacity: 0, y: -6, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.985 },
  transition: { duration: DUR.base, ease: EASE_OUT },
}

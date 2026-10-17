import { Inter, Space_Grotesk } from "next/font/google"

// Display face for headings and numbers, Inter for body copy.
export const displayFont = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" })
export const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" })

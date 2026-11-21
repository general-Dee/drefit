import { Inter, Space_Grotesk, Instrument_Serif } from "next/font/google"

// Display face for headings and numbers, Inter for body copy.
export const displayFont = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" })
export const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" })
// Editorial accent (SIL Open Font License): used sparingly, in italics, for one
// or two emphasis words per marketing headline. Never for body copy or UI.
export const accentFont = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-accent", display: "swap" })

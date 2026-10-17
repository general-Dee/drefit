import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"
export const metadata: Metadata = {
  title: "Drefit - Elite Fitness Coaching Nigeria",
  description: "Personalized coaching, coach-designed diet plans, and community support.",
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-drefit-dark">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Providers } from "./providers"
export const metadata: Metadata = {
  title: "Drefit - Elite Fitness Coaching Nigeria",
  description: "Personalized coaching, coach-designed diet plans, and community support.",
  applicationName: "Drefit",
  appleWebApp: { capable: true, title: "Drefit", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
}
export const viewport: Viewport = {
  themeColor: "#0A0A0A",
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

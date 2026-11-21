import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Providers } from "./providers"
import { bodyFont, displayFont } from "./fonts"
export const metadata: Metadata = {
  title: "Drefit - Elite Fitness Coaching Nigeria",
  description: "Personalized coaching, coach-designed diet plans, and community support.",
  applicationName: "Drefit",
  appleWebApp: { capable: true, title: "Drefit", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
}
export const viewport: Viewport = {
  themeColor: "#0A0A0B",
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${displayFont.variable} ${bodyFont.variable}`}>
      <head>
        {/* Lighter visual tier for low-power devices: drop backdrop blur (see globals.css). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var n=navigator,c=n.connection;if((n.deviceMemory&&n.deviceMemory<=4)||(n.hardwareConcurrency&&n.hardwareConcurrency<=4)||(c&&c.saveData)){document.documentElement.classList.add('perf-lite')}}catch(e){}",
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

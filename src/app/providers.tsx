"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ServiceWorkerRegistrar />
      {children}
      <Toaster position="top-center" />
    </SessionProvider>
  )
}

import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      subscriptionStatus: string
      trialEndsAt?: string
      subscriptionCurrentPeriodEnd?: string
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
    subscriptionStatus?: string
    trialEndsAt?: string
    subscriptionCurrentPeriodEnd?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    subscriptionStatus: string
    trialEndsAt?: string
    subscriptionCurrentPeriodEnd?: string
  }
}

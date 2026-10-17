import NextAuth from "next-auth"
import { CredentialsSignin } from "next-auth"
import Google from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare, hash } from "bcryptjs"
import { randomUUID } from "crypto"
import { ID, Query } from "node-appwrite"
import { z } from "zod"
import { serverDatabases } from "@/lib/appwrite/server"
import { DATABASE_ID, USERS_COLLECTION_ID, type AppwriteUserDoc } from "@/lib/appwrite/schema"
import { TRIAL_DAYS } from "@/lib/paystack/plan"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { isLoginLocked, recordLoginFailure, clearLoginFailures } from "@/lib/login-throttle"
import { isAdminEmail, resolveRole } from "@/lib/admin"

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) })

let dummyHashPromise: Promise<string> | null = null
function dummyHash(): Promise<string> {
  dummyHashPromise ??= hash(randomUUID(), 10)
  return dummyHashPromise
}

class RateLimitedSignin extends CredentialsSignin {
  static type = "RateLimited"
}

async function findUserByEmail(email: string): Promise<AppwriteUserDoc | undefined> {
  const result = await serverDatabases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
    Query.equal("email", email),
  ])
  return result.documents[0] as unknown as AppwriteUserDoc | undefined
}

// Google sign-in has no registration step, so provision a trialing account
// the first time a given Google email signs in.
async function findOrCreateGoogleUser(email: string, name: string): Promise<AppwriteUserDoc> {
  const existing = await findUserByEmail(email)
  if (existing) return existing

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const unusablePassword = await hash(randomUUID(), 10) // Google users never log in with a password
  const doc = await serverDatabases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, ID.unique(), {
    name,
    email,
    password: unusablePassword,
    role: isAdminEmail(email) ? "admin" : "user",
    subscriptionStatus: "trialing",
    trialEndsAt,
  })
  return doc as unknown as AppwriteUserDoc
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
    CredentialsProvider({
      name: "credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const ip = getClientIp(request)
        const { email, password } = parsed.data
        // Persistent lockout (Appwrite-backed). Applied identically whether or
        // not the account exists, so it can't be used to enumerate emails.
        // The in-memory limiter is kept as a per-instance backstop in case the
        // Appwrite-backed store is unavailable (it fails open).
        if (!rateLimit(`login:${ip}:${email.trim().toLowerCase()}`, 10, 60_000).success || (await isLoginLocked(ip, email))) {
          throw new RateLimitedSignin()
        }

        const user = await findUserByEmail(email)
        // Always run a bcrypt comparison so response timing doesn't reveal
        // whether the email is registered.
        const isValid = await compare(password, user?.password ?? (await dummyHash()))
        if (!user || !isValid) {
          await recordLoginFailure(ip, email)
          return null
        }
        await clearLoginFailures(ip, email)
        return {
          id: user.$id,
          email: user.email,
          name: user.name,
          role: resolveRole(user.email, user.role),
          subscriptionStatus: user.subscriptionStatus ?? "inactive",
          trialEndsAt: user.trialEndsAt,
          subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && token.email) {
        const dbUser = await findOrCreateGoogleUser(token.email as string, (token.name as string) ?? "Athlete")
        token.id = dbUser.$id
        token.role = resolveRole(dbUser.email, dbUser.role)
        token.subscriptionStatus = dbUser.subscriptionStatus ?? "inactive"
        token.trialEndsAt = dbUser.trialEndsAt
        token.subscriptionCurrentPeriodEnd = dbUser.subscriptionCurrentPeriodEnd
        return token
      }

      if (user) {
        token.id = user.id
        token.role = (user as any).role ?? "user"
        token.subscriptionStatus = (user as any).subscriptionStatus ?? "inactive"
        token.trialEndsAt = (user as any).trialEndsAt
        token.subscriptionCurrentPeriodEnd = (user as any).subscriptionCurrentPeriodEnd
        return token
      }

      if (token.email) {
        // Refresh subscription/role on every request so Paystack webhook
        // updates and admin changes are picked up without re-login.
        const dbUser = await findUserByEmail(token.email as string)
        if (dbUser) {
          token.role = resolveRole(dbUser.email, dbUser.role)
          token.subscriptionStatus = dbUser.subscriptionStatus ?? "inactive"
          token.trialEndsAt = dbUser.trialEndsAt
          token.subscriptionCurrentPeriodEnd = dbUser.subscriptionCurrentPeriodEnd
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.subscriptionStatus = token.subscriptionStatus as string
        session.user.trialEndsAt = token.trialEndsAt as string | undefined
        session.user.subscriptionCurrentPeriodEnd = token.subscriptionCurrentPeriodEnd as string | undefined
      }
      return session
    }
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
})

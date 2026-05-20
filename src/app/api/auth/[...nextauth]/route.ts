import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) })

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
    CredentialsProvider({
      name: "credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null
        const supabase = createClient()
        const { data: user } = await supabase.from("users").select("*").eq("email", parsed.data.email).single()
        if (!user) return null
        const isValid = await compare(parsed.data.password, user.password)
        if (!isValid) return null
        return { id: user.id, email: user.email, name: user.name, image: user.image }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) token.id = user.id; return token },
    async session({ session, token }) { if (session.user) session.user.id = token.id as string; return session }
  },
  pages: { signIn: "/login", signUp: "/register" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
})

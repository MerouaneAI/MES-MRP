import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { rateLimit, resetRateLimit } from "@/lib/rate-limit"
import "@/lib/env" // Trap #9: validate config before anything else

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8-hour shift
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").trim().toLowerCase()
        const password = String(creds?.password ?? "")
        if (!email || !password) return null

        // Trap #11: throttle attempts per email (5 / 5 min).
        const gate = await rateLimit(`login:${email}`, 5, 300)
        if (!gate.ok) throw new Error("Too many attempts. Wait a few minutes and try again.")

        const [user] = await db.select().from(users).where(eq(users.email, email))
        if (!user?.passwordHash || !user.isActive) return null // deactivated users can't log in
        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        await resetRateLimit(`login:${email}`) // clear the counter on success
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
        token.uid = (user as { id?: string }).id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        ;(session.user as { id?: unknown }).id = token.uid ?? token.sub // Trap #12
        ;(session.user as { role?: unknown }).role = token.role
      }
      return session
    },
  },
})
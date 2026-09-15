import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { roles } from "@/db/schema/roles"
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

        const [user] = await db
          .select({
            id: users.id, name: users.name, email: users.email,
            passwordHash: users.passwordHash, isActive: users.isActive,
            roleId: users.roleId, roleName: roles.name,
          })
          .from(users)
          .innerJoin(roles, eq(users.roleId, roles.id))
          .where(eq(users.email, email))
        if (!user?.passwordHash || !user.isActive) return null
        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        await resetRateLimit(`login:${email}`)
        return { id: user.id, name: user.name, email: user.email, roleId: user.roleId, roleName: user.roleName }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.roleId = (user as { roleId?: string }).roleId
        token.roleName = (user as { roleName?: string }).roleName
        token.uid = (user as { id?: string }).id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        ;(session.user as { id?: unknown }).id = token.uid ?? token.sub
        ;(session.user as { roleId?: unknown }).roleId = token.roleId
        ;(session.user as { roleName?: unknown }).roleName = token.roleName
      }
      return session
    },
  },
})
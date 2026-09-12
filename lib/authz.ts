import "server-only"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { can, type Role } from "@/lib/roles"

export type { Role } from "@/lib/roles"
export { can } from "@/lib/roles"

export type SessionUser = { id: string; email: string; name?: string; role: Role }


export type AuthzResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string }

// Gate a server action. `fresh: true` re-reads role + active flag from the DB
// so role changes / deactivations take effect immediately (Trap #2).
export async function authorize(
  min: Role,
  opts: { fresh?: boolean } = {},
): Promise<AuthzResult> {
  const session = await auth()
  const u = session?.user as SessionUser | undefined
  if (!u?.id) return { ok: false, error: "Unauthorized" }

  let role = u.role
  if (opts.fresh) {
    const [row] = await db
      .select({ role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, u.id))
    if (!row || !row.isActive) return { ok: false, error: "Your account is inactive." }
    role = row.role
  }

  if (!can(role, min)) return { ok: false, error: "You do not have permission to do this." }
  return { ok: true, user: { ...u, role } }
}
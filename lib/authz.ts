import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema/auth"

export type Role = "admin" | "operator" | "viewer"
export type SessionUser = { id: string; email: string; name?: string; role: Role }

const RANK: Record<Role, number> = { viewer: 0, operator: 1, admin: 2 }

export function can(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min]
}

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
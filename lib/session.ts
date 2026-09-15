import { loadPermissions, type SessionUser } from "@/lib/authz"
import type { PermissionMap } from "@/lib/roles"
import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { roles } from "@/db/schema/roles"
import { eq } from "drizzle-orm"

export type SessionWithPermissions = {
  user: SessionUser
  permissions: PermissionMap
}

export async function currentUser(): Promise<SessionWithPermissions | null> {
  const session = await auth()
  const u = session?.user as { id?: string; email?: string; name?: string } | undefined
  if (!u?.id) return null

  const [row] = await db
    .select({
      roleId: users.roleId,
      isActive: users.isActive,
      roleName: roles.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, u.id))

  if (!row || !row.isActive) return null

  const permissions = await loadPermissions(row.roleId, row.roleName)

  return {
    user: {
      id: u.id,
      email: u.email ?? "",
      name: u.name,
      roleId: row.roleId,
      roleName: row.roleName,
    },
    permissions,
  }
}
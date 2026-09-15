import "server-only"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { roles } from "@/db/schema/roles"
import { rolePermissions } from "@/db/schema/roles"
import { type PageKey, type Permission, type PermissionMap } from "@/lib/roles"

export type SessionUser = {
  id: string
  email: string
  name?: string
  roleId: string
  roleName: string
}

export type AuthzResult =
  | { ok: true; user: SessionUser; permission: Permission; permissions: PermissionMap }
  | { ok: false; error: string }

// Load the full permission map for a role
export async function loadPermissions(roleId: string, roleName?: string): Promise<PermissionMap> {
  const map: PermissionMap = {}
  if (roleName === "admin") {
    for (const p of (["dashboard", "parties", "items", "lots", "purchasing", "invoices", "boms", "work-orders", "shopfloor", "documents", "eco", "users", "audit", "account"] as PageKey[])) {
      map[p] = { canView: true, canWrite: true, canDelete: true, dataFilter: null }
    }
    return map
  }
  const rows = await db
    .select({
      page: rolePermissions.page,
      canView: rolePermissions.canView,
      canWrite: rolePermissions.canWrite,
      canDelete: rolePermissions.canDelete,
      dataFilter: rolePermissions.dataFilter,
    })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId))

  for (const row of rows) {
    map[row.page as PageKey] = {
      canView: row.canView,
      canWrite: row.canWrite,
      canDelete: row.canDelete,
      dataFilter: row.dataFilter as Record<string, string[]> | null,
    }
  }
  return map
}

// Gate a server action or page by page + action
export async function authorize(
  page: PageKey,
  action: "view" | "write" | "delete" = "view",
): Promise<AuthzResult> {
  const session = await auth()
  const u = session?.user as { id?: string; email?: string; name?: string; roleId?: string; roleName?: string } | undefined
  if (!u?.id) return { ok: false, error: "Unauthorized" }

  // Fresh read from DB to catch deactivations / role changes
  const [row] = await db
    .select({
      roleId: users.roleId,
      isActive: users.isActive,
      roleName: roles.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, u.id))

  if (!row || !row.isActive) return { ok: false, error: "Your account is inactive." }

  const permissions = await loadPermissions(row.roleId, row.roleName)
  const perm = permissions[page]

  if (!perm) return { ok: false, error: "You do not have permission to access this page." }

  const allowed =
    action === "view" ? perm.canView :
    action === "write" ? perm.canWrite :
    perm.canDelete

  if (!allowed) return { ok: false, error: "You do not have permission to do this." }

  return {
    ok: true,
    user: { id: u.id, email: u.email ?? "", name: u.name, roleId: row.roleId, roleName: row.roleName },
    permission: perm,
    permissions,
  }
}
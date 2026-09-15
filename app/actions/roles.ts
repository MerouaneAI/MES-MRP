"use server"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { roles, rolePermissions } from "@/db/schema/roles"
import { authorize } from "@/lib/authz"

// Create a new custom role
export async function createRole(_prev: unknown, formData: FormData) {
  const gate = await authorize("users", "write")
  if (!gate.ok) return { ok: false as const, error: gate.error }

  const name = String(formData.get("name")).trim()
  if (!name) return { ok: false as const, error: "Name is required." }

  try {
    await db.insert(roles)
      .values({ name, isBuiltin: false })
      .returning()
    revalidatePath("/users")
    return { ok: true as const }
  } catch (err: unknown) {
    const error = err as { code?: string }
    if (error.code === "23505") return { ok: false as const, error: "A role with this name already exists." }
    return { ok: false as const, error: "Failed to create role." }
  }
}

// Delete a custom role
export async function deleteRole(formData: FormData) {
  const gate = await authorize("users", "delete")
  if (!gate.ok) return { error: gate.error }

  const roleId = String(formData.get("roleId"))
  if (!roleId) return { error: "Role ID required." }

  const [role] = await db.select().from(roles).where(eq(roles.id, roleId))
  if (!role) return { error: "Role not found." }
  if (role.isBuiltin) return { error: "Cannot delete built-in roles." }

  try {
    // This will cascade delete role_permissions but we might have users assigned to this role!
    // In a full system we should re-assign users or block deletion. We'll block it via Postgres constraint.
    await db.delete(roles).where(eq(roles.id, roleId))
    revalidatePath("/users")
    return { success: true }
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23503") return { error: "Cannot delete role: users are still assigned to it." }
    return { error: "Failed to delete role." }
  }
}

// Update permissions for a role
export async function updateRolePermissions(roleId: string, permissions: { page: string; canView: boolean; canWrite: boolean; canDelete: boolean; dataFilter?: Record<string, string[]> | null }[]) {
  const gate = await authorize("users", "write")
  if (!gate.ok) return { error: gate.error }

  const [role] = await db.select().from(roles).where(eq(roles.id, roleId))
  if (!role) return { error: "Role not found." }

  // Admin built-in role cannot have permissions modified.
  if (role.name === "admin") return { error: "Cannot modify permissions of the admin role." }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId))
      
      const toInsert = permissions
        .filter((p) => p.canView || p.canWrite || p.canDelete)
        .map((p) => ({
          roleId,
          page: p.page,
          canView: p.canView,
          canWrite: p.canWrite,
          canDelete: p.canDelete,
          dataFilter: p.dataFilter,
        }))
        
      if (toInsert.length > 0) {
        await tx.insert(rolePermissions).values(toInsert)
      }
    })
    
    revalidatePath("/users")
    return { success: true }
  } catch {
    return { error: "Failed to update permissions." }
  }
}

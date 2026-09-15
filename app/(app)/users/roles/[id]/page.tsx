import { notFound, redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { roles, rolePermissions } from "@/db/schema/roles"
import { authorize } from "@/lib/authz"
import { PageHeader, buttonClass } from "@/components/ui"
import Link from "next/link"
import { RolePermissionsForm } from "@/app/(app)/users/roles/[id]/role-permissions-form"

export default async function RolePermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gate = await authorize("users", "view")
  if (!gate.ok) redirect("/forbidden")
  const canWrite = gate.permission?.canWrite ?? false

  const [role] = await db.select().from(roles).where(eq(roles.id, id))
  if (!role) notFound()

  const perms = (await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, role.id))).map(p => ({
    ...p,
    dataFilter: p.dataFilter as Record<string, string[]> | null
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users" className={buttonClass({ variant: "ghost", size: "sm" })}>← Back</Link>
        <PageHeader 
          title={`Edit Role: ${role.name}`} 
          description={role.isBuiltin ? "Built-in role. Permissions cannot be modified." : "Configure access levels and data filters for this custom role."} 
        />
      </div>

      <RolePermissionsForm role={role} permissions={perms} canWrite={canWrite} />
    </div>
  )
}

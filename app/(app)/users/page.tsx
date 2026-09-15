import { redirect } from "next/navigation"
import { asc, eq, ilike, or } from "drizzle-orm"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { roles } from "@/db/schema/roles"
import { authorize } from "@/lib/authz"
import { setUserRole, setUserActive, resetUserPassword } from "@/app/actions/users"
import { CreateUserForm } from "./users-forms"
import { CreateRoleForm } from "./roles-forms"
import {
  PageHeader, Table, THead, TH, TBody, TR, TD,
  Select, Input, Button, buttonClass, SearchInput,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

export const dynamic = "force-dynamic"

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const gate = await authorize("users", "view")
  if (!gate.ok) redirect("/forbidden")
  const canWrite = gate.permission?.canWrite ?? false
  

  const query = db
    .select({
      id: users.id, email: users.email, name: users.name, isActive: users.isActive,
      roleId: users.roleId, roleName: roles.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
  if (q) {
    query.where(or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`)))
  }
  const rows = await query.orderBy(asc(users.email))

  const allRoles = await db.select().from(roles).orderBy(asc(roles.name))

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Users" 
        description="Manage user accounts and roles."
        actions={<SearchInput placeholder="Search users..." />}
      />
      
      {canWrite && <CreateUserForm roles={allRoles} />}
      <Reveal className="card p-2">
        <Table>
          <THead><TH>Email</TH><TH>Name</TH><TH>Role</TH><TH>Active</TH><TH>Reset password</TH></THead>
          <TBody>
            {rows.map((u) => (
              <TR key={u.id}>
                <TD className="font-medium">{u.email}{u.id === gate.user.id ? " (you)" : ""}</TD>
                <TD>{u.name}</TD>
                <TD>
                  {canWrite ? (
                    <form action={setUserRole} className="flex gap-1">
                      <input type="hidden" name="userId" value={u.id} />
                      <Select name="roleId" defaultValue={u.roleId}>
                        {allRoles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </Select>
                      <Button type="submit" variant="secondary" size="sm">Set</Button>
                    </form>
                  ) : (
                    u.roleName
                  )}
                </TD>
                <TD>
                  {canWrite && (
                    <form action={setUserActive}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="active" value={(!u.isActive).toString()} />
                      <Button type="submit" variant={u.isActive ? "danger" : "primary"} size="sm">{u.isActive ? "Deactivate" : "Reactivate"}</Button>
                    </form>
                  )}
                </TD>
                <TD>
                  {canWrite && (
                    <form action={resetUserPassword} className="flex gap-1">
                      <input type="hidden" name="userId" value={u.id} />
                      <Input name="password" type="password" placeholder="New password" />
                      <Button type="submit" variant="secondary" size="sm">Reset</Button>
                    </form>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Reveal>

      {/* Roles Management Section */}
      <div className="mt-12 space-y-6">
        <PageHeader title="Roles & Permissions" description="Manage access levels and data filters." />
        {canWrite && <CreateRoleForm />}
        <Reveal className="card p-2">
          <Table>
            <THead><TH>Role Name</TH><TH>Type</TH><TH></TH></THead>
            <TBody>
              {allRoles.map(r => (
                <TR key={r.id}>
                  <TD className="font-medium">{r.name}</TD>
                  <TD>{r.isBuiltin ? <span className="text-ink-faint">Built-in</span> : "Custom"}</TD>
                  <TD className="text-right">
                    <a href={`/users/roles/${r.id}`} className={buttonClass({ variant: "secondary", size: "sm" })}>Edit Permissions</a>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Reveal>
      </div>
    </div>
  )
}
import { redirect } from "next/navigation"
import { asc } from "drizzle-orm"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { setUserRole, setUserActive, resetUserPassword } from "@/app/actions/users"
import { CreateUserForm } from "./users-forms"
import { PageHeader } from "@/components/ui/page-header"
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const me = await currentUser()
  if (!me || !can(me.role, "admin")) redirect("/forbidden")

  const rows = await db.select().from(users).orderBy(asc(users.email))

  return (
    <div className="space-y-6">
      <PageHeader title="Users" />
      <CreateUserForm />
      <Table>
        <THead><TH>Email</TH><TH>Name</TH><TH>Role</TH><TH>Active</TH><TH>Reset password</TH></THead>
        <TBody>
          {rows.map((u) => (
            <TR key={u.id}>
              <TD>{u.email}{u.id === me.id ? " (you)" : ""}</TD>
              <TD>{u.name}</TD>
              <TD>
                <form action={setUserRole} style={{ display: "flex", gap: 4 }}>
                  <input type="hidden" name="userId" value={u.id} />
                  <select name="role" defaultValue={u.role}>
                    <option value="viewer">viewer</option>
                    <option value="operator">operator</option>
                    <option value="admin">admin</option>
                  </select>
                  <button type="submit">Set</button>
                </form>
              </TD>
              <TD>
                <form action={setUserActive}>
                  <input type="hidden" name="userId" value={u.id} />
                  <input type="hidden" name="active" value={(!u.isActive).toString()} />
                  <button type="submit">{u.isActive ? "Deactivate" : "Reactivate"}</button>
                </form>
              </TD>
              <TD>
                <form action={resetUserPassword} style={{ display: "flex", gap: 4 }}>
                  <input type="hidden" name="userId" value={u.id} />
                  <input name="password" type="password" placeholder="New password" />
                  <button type="submit">Reset</button>
                </form>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  )
}
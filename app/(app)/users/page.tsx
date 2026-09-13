import { redirect } from "next/navigation"
import { asc, ilike, or } from "drizzle-orm"
import { db } from "@/db"
import { users } from "@/db/schema/auth"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { setUserRole, setUserActive, resetUserPassword } from "@/app/actions/users"
import { CreateUserForm } from "./users-forms"
import {
  PageHeader, Table, THead, TH, TBody, TR, TD,
  Select, Input, Button, SearchInput,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

export const dynamic = "force-dynamic"

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const me = await currentUser()
  if (!me || !can(me.role, "admin")) redirect("/forbidden")

  const query = db.select().from(users)
  if (q) {
    query.where(or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`)))
  }
  const rows = await query.orderBy(asc(users.email))

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Users" 
        description="Manage user accounts and roles."
        actions={<SearchInput placeholder="Search users..." />}
      />
      <CreateUserForm />
      <Reveal className="card p-2">
        <Table>
          <THead><TH>Email</TH><TH>Name</TH><TH>Role</TH><TH>Active</TH><TH>Reset password</TH></THead>
          <TBody>
            {rows.map((u) => (
              <TR key={u.id}>
                <TD className="font-medium">{u.email}{u.id === me.id ? " (you)" : ""}</TD>
                <TD>{u.name}</TD>
                <TD>
                  <form action={setUserRole} className="flex gap-1">
                    <input type="hidden" name="userId" value={u.id} />
                    <Select name="role" defaultValue={u.role}>
                      <option value="viewer">viewer</option>
                      <option value="operator">operator</option>
                      <option value="admin">admin</option>
                    </Select>
                    <Button type="submit" variant="secondary" size="sm">Set</Button>
                  </form>
                </TD>
                <TD>
                  <form action={setUserActive}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="active" value={(!u.isActive).toString()} />
                    <Button type="submit" variant={u.isActive ? "danger" : "primary"} size="sm">{u.isActive ? "Deactivate" : "Reactivate"}</Button>
                  </form>
                </TD>
                <TD>
                  <form action={resetUserPassword} className="flex gap-1">
                    <input type="hidden" name="userId" value={u.id} />
                    <Input name="password" type="password" placeholder="New password" />
                    <Button type="submit" variant="secondary" size="sm">Reset</Button>
                  </form>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Reveal>
    </div>
  )
}
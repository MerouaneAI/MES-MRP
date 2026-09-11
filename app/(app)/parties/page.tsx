import Link from "next/link"
import { desc } from "drizzle-orm"
import { db } from "@/db"
import { parties } from "@/db/schema/parties"
import { deleteParty } from "@/app/actions/parties"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { PageHeader } from "@/components/ui/page-header"
import { Button, buttonClass } from "@/components/ui/button"
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Users } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PartiesPage() {
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  const canDelete = !!user && can(user.role, "admin")
  const rows = await db.select().from(parties).orderBy(desc(parties.createdAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parties"
        actions={canWrite ? <Link href="/parties/new" className={buttonClass()}>+ Add party</Link> : undefined}
      />

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No parties yet" description="Add your first customer or supplier." action={canWrite ? <Link href="/parties/new" className={buttonClass()}>+ Add party</Link> : undefined} />
      ) : (
        <Table>
          <THead>
            <TH>Name</TH><TH>Type</TH>
            <TH>Phone</TH><TH>NIF</TH><TH />
          </THead>
          <TBody>
            {rows.map((p) => (
              <TR key={p.id}>
                <TD>{p.name}</TD>
                <TD><Badge>{p.type}</Badge></TD>
                <TD>{p.phone ?? "—"}</TD>
                <TD>{p.nif ?? "—"}</TD>
                <TD className="flex items-center gap-2">
                  {canWrite && <Link href={`/parties/${p.id}/edit`} className={buttonClass({ variant: "ghost", size: "sm" })}>Edit</Link>}
                  {canDelete && (
                    <form action={deleteParty}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button type="submit" variant="danger" size="sm">Delete</Button>
                    </form>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  )
}

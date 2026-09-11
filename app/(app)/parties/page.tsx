import Link from "next/link"
import { desc } from "drizzle-orm"
import { Users } from "lucide-react"
import { db } from "@/db"
import { parties } from "@/db/schema/parties"
import { deleteParty } from "@/app/actions/parties"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import {
  PageHeader, Table, THead, TH, TBody, TR, TD,
  StatusBadge, EmptyState, Button, buttonClass,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

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
        description="Customers, suppliers, and contacts."
        actions={canWrite ? <Link href="/parties/new" className={buttonClass()}>+ Add party</Link> : undefined}
      />

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No parties yet" description="Add your first customer or supplier."
          action={canWrite ? <Link href="/parties/new" className={buttonClass({ size: "sm" })}>+ Add party</Link> : undefined} />
      ) : (
        <Reveal className="card p-2">
          <Table>
            <THead>
              <TH>Name</TH><TH>Type</TH><TH>Phone</TH><TH>NIF</TH><TH className="text-right">Actions</TH>
            </THead>
            <TBody>
              {rows.map((p) => (
                <TR key={p.id}>
                  <TD className="font-medium">{p.name}</TD>
                  <TD><StatusBadge status={p.type} /></TD>
                  <TD className="text-ink-muted">{p.phone ?? "—"}</TD>
                  <TD className="text-ink-muted">{p.nif ?? "—"}</TD>
                  <TD align="right">
                    <div className="flex justify-end gap-2">
                      {canWrite && <Link href={`/parties/${p.id}/edit`} className={buttonClass({ variant: "ghost", size: "sm" })}>Edit</Link>}
                      {canDelete && (
                        <form action={deleteParty}>
                          <input type="hidden" name="id" value={p.id} />
                          <Button type="submit" variant="danger" size="sm">Delete</Button>
                        </form>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Reveal>
      )}
    </div>
  )
}

// app/items/page.tsx
import Link from "next/link"
import { desc } from "drizzle-orm"
import { db } from "@/db"
import { items } from "@/db/schema/inventory"
import { deleteItem } from "@/app/actions/items"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { PageHeader } from "@/components/ui/page-header"
import { buttonClass } from "@/components/ui/button"
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function ItemsPage() {
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  const canDelete = !!user && can(user.role, "admin")
  const rows = await db.select().from(items).orderBy(desc(items.createdAt))
  return (
    <div className="space-y-6">
      <PageHeader
        title="Items"
        actions={canWrite ? <Link href="/items/new" className={buttonClass()}>+ Add item</Link> : undefined}
      />
      {rows.length === 0 ? <p>No items yet.</p> : (
        <Table>
          <THead><TH>SKU</TH><TH>Name</TH><TH>Kind</TH><TH>Unit</TH><TH /></THead>
          <TBody>
            {rows.map((it) => (
              <TR key={it.id}>
                <TD>{it.sku}</TD>
                <TD>{it.name}</TD>
                <TD><Badge>{it.kind}</Badge></TD>
                <TD>{it.unit}</TD>
                <TD className="flex items-center gap-2">
                  {canWrite && <Link href={`/items/${it.id}/edit`}>Edit</Link>}
                  {canDelete && (
                    <form action={deleteItem}>
                      <input type="hidden" name="id" value={it.id} />
                      <button type="submit">Delete</button>
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
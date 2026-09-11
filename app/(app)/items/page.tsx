// app/items/page.tsx
import Link from "next/link"
import { desc } from "drizzle-orm"
import { db } from "@/db"
import { items } from "@/db/schema/inventory"
import { deleteItem } from "@/app/actions/items"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { PageHeader } from "@/components/ui/page-header"
import { Button, buttonClass } from "@/components/ui/button"
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Package } from "lucide-react"

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
      {rows.length === 0 ? <EmptyState icon={Package} title="No items yet" description="Add your first raw material or finished good." action={canWrite ? <Link href="/items/new" className={buttonClass()}>+ Add item</Link> : undefined} /> : (
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
                  {canWrite && <Link href={`/items/${it.id}/edit`} className={buttonClass({ variant: "ghost", size: "sm" })}>Edit</Link>}
                  {canDelete && (
                    <form action={deleteItem}>
                      <input type="hidden" name="id" value={it.id} />
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
import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { workOrders } from "@/db/schema/production"
import { items } from "@/db/schema/inventory"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { PageHeader } from "@/components/ui/page-header"
import { buttonClass } from "@/components/ui/button"
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Factory } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function WorkOrdersPage() {
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  const rows = await db
    .select({
      id: workOrders.id, status: workOrders.status,
      quantityPlanned: workOrders.quantityPlanned, quantityProduced: workOrders.quantityProduced,
      productName: items.name, productSku: items.sku,
    })
    .from(workOrders)
    .innerJoin(items, eq(workOrders.productItemId, items.id))
    .orderBy(desc(workOrders.createdAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work orders"
        actions={canWrite ? <Link href="/work-orders/new" className={buttonClass()}>+ New work order</Link> : undefined}
      />
      {rows.length === 0 ? <EmptyState icon={Factory} title="No work orders yet" description="Create one to start production." action={canWrite ? <Link href="/work-orders/new" className={buttonClass()}>+ New work order</Link> : undefined} /> : (
        <Table>
          <THead><TH>Product</TH><TH>Status</TH><TH className="text-right">Planned</TH><TH className="text-right">Produced</TH><TH /></THead>
          <TBody>
            {rows.map((w) => (
              <TR key={w.id}>
                <TD>{w.productName} <span className="text-ink-muted">({w.productSku})</span></TD>
                <TD><StatusBadge status={w.status} /></TD>
                <TD align="right">{w.quantityPlanned}</TD>
                <TD align="right">{w.quantityProduced}</TD>
                <TD><Link href={`/work-orders/${w.id}`}>Open</Link></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  )
}

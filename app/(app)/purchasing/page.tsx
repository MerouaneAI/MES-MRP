// app/purchasing/page.tsx
import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { purchaseOrders } from "@/db/schema/purchases"
import { parties } from "@/db/schema/parties"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { PageHeader } from "@/components/ui/page-header"
import { buttonClass } from "@/components/ui/button"
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function PurchasingPage() {
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  const rows = await db
    .select({
      id: purchaseOrders.id,
      status: purchaseOrders.status,
      totalAmount: purchaseOrders.totalAmount,
      supplierName: parties.name,
    })
    .from(purchaseOrders)
    .innerJoin(parties, eq(purchaseOrders.supplierId, parties.id))
    .orderBy(desc(purchaseOrders.createdAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchasing"
        actions={canWrite ? <Link href="/purchasing/new" className={buttonClass()}>+ New purchase order</Link> : undefined}
      />
      {rows.length === 0 ? <p>No purchase orders yet.</p> : (
        <Table>
          <THead><TH>Supplier</TH><TH>Status</TH><TH className="text-right">Total (DZD)</TH><TH /></THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD>{r.supplierName}</TD>
                <TD><StatusBadge status={r.status} /></TD>
                <TD align="right">{r.totalAmount}</TD>
                <TD><Link href={`/purchasing/${r.id}`}>Open</Link></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  )
}
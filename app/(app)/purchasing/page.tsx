// app/purchasing/page.tsx
import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { ShoppingCart } from "lucide-react"
import { db } from "@/db"
import { purchaseOrders } from "@/db/schema/purchases"
import { parties } from "@/db/schema/parties"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import {
  PageHeader, Table, THead, TH, TBody, TR, TD,
  StatusBadge, EmptyState, buttonClass,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

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
        description="Purchase orders and supplier management."
        actions={canWrite ? <Link href="/purchasing/new" className={buttonClass()}>+ New purchase order</Link> : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No purchase orders yet" description="Create one to order materials from a supplier."
          action={canWrite ? <Link href="/purchasing/new" className={buttonClass({ size: "sm" })}>+ New purchase order</Link> : undefined} />
      ) : (
        <Reveal className="card p-2">
          <Table>
            <THead><TH>Supplier</TH><TH>Status</TH><TH className="text-right">Total (DZD)</TH><TH /></THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-medium">{r.supplierName}</TD>
                  <TD><StatusBadge status={r.status} /></TD>
                  <TD align="right">{r.totalAmount}</TD>
                  <TD><Link href={`/purchasing/${r.id}`} className={buttonClass({ variant: "ghost", size: "sm" })}>Open</Link></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Reveal>
      )}
    </div>
  )
}
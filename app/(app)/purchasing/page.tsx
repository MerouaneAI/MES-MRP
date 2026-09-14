// app/purchasing/page.tsx
import Link from "next/link"
import { desc, eq, ilike } from "drizzle-orm"
import { ShoppingCart } from "lucide-react"
import { db } from "@/db"
import { purchaseOrders } from "@/db/schema/purchases"
import { parties } from "@/db/schema/parties"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import {
  PageHeader, Table, THead, TH, TBody, TR, TD,
  StatusBadge, EmptyState, buttonClass, SearchInput,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

export const dynamic = "force-dynamic"

export default async function PurchasingPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  
  const query = db
    .select({
      id: purchaseOrders.id,
      status: purchaseOrders.status,
      totalAmount: purchaseOrders.totalAmount,
      receivedAt: purchaseOrders.receivedAt,
      supplierName: parties.name,
    })
    .from(purchaseOrders)
    .innerJoin(parties, eq(purchaseOrders.supplierId, parties.id))

  if (q) {
    query.where(ilike(parties.name, `%${q}%`))
  }

  const rows = await query.orderBy(desc(purchaseOrders.createdAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchasing"
        description="Purchase orders and supplier management."
        actions={
          <>
            <SearchInput placeholder="Search suppliers..." />
            {canWrite && <Link href="/purchasing/new" className={buttonClass()}>+ New purchase order</Link>}
          </>
        }
      />
      {rows.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No purchase orders yet" description="Create one to order materials from a supplier."
          action={canWrite ? <Link href="/purchasing/new" className={buttonClass({ size: "sm" })}>+ New purchase order</Link> : undefined} />
      ) : (
        <Reveal className="card p-2">
          <Table>
            <THead><TH>Supplier</TH><TH>Status</TH><TH>Receive Date</TH><TH className="text-right">Total (DZD)</TH><TH /></THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-medium">{r.supplierName}</TD>
                  <TD><StatusBadge status={r.status} /></TD>
                  <TD className="text-ink-muted">{r.receivedAt ? new Date(r.receivedAt).toISOString().slice(0, 10) : "—"}</TD>
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
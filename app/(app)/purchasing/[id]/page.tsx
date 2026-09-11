import { notFound } from "next/navigation"
import Link from "next/link"
import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { purchaseOrders, purchaseOrderLines } from "@/db/schema/purchases"
import { parties } from "@/db/schema/parties"
import { items } from "@/db/schema/inventory"
import { markOrdered, receivePurchaseOrder, removePurchaseOrderLine } from "@/app/actions/purchasing"
import { AddLineForm } from "../add-line-form"
import { PageHeader } from "@/components/ui/page-header"
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/badge"
import { Button, buttonClass } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ListPlus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id))
  if (!po) notFound()

  const [supplier] = await db.select().from(parties).where(eq(parties.id, po.supplierId))
  const lines = await db.select().from(purchaseOrderLines).where(eq(purchaseOrderLines.poId, id))
  const itemOptions = await db.select({ id: items.id, name: items.name, sku: items.sku }).from(items).orderBy(asc(items.name))

  const editable = po.status !== "received"

  return (
    <div className="space-y-6">
      <Link href="/purchasing" className={buttonClass({ variant: "ghost", size: "sm" })}>← Back to purchasing</Link>
      <PageHeader title="Purchase order" />
      <p>Supplier: <b>{supplier?.name ?? "—"}</b> · Status: <StatusBadge status={po.status} /> · Total: <b>{po.totalAmount} DZD</b></p>

      <h2>Lines</h2>
      {lines.length === 0 ? <EmptyState icon={ListPlus} title="No lines yet" description="Add items to this purchase order." /> : (
        <Table>
          <THead><TH>Item</TH><TH className="text-right">Qty</TH><TH className="text-right">Unit price</TH><TH className="text-right">Line total</TH>{editable && <TH />}</THead>
          <TBody>
            {lines.map((l) => (
              <TR key={l.id}>
                <TD>{l.description ?? l.itemId}</TD>
                <TD align="right">{l.quantity}</TD>
                <TD align="right">{l.unitPrice}</TD>
                <TD align="right">{l.lineTotal}</TD>
                {editable && (
                  <TD>
                    <form action={removePurchaseOrderLine}>
                      <input type="hidden" name="lineId" value={l.id} />
                      <input type="hidden" name="poId" value={po.id} />
                      <Button type="submit" variant="danger" size="sm">Remove</Button>
                    </form>
                  </TD>
                )}
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {editable && <AddLineForm poId={po.id} items={itemOptions} />}

      <div className="flex gap-3 mt-6">
        {po.status === "draft" && (
          <form action={markOrdered}>
            <input type="hidden" name="poId" value={po.id} />
            <Button type="submit">Mark as ordered</Button>
          </form>
        )}
        {po.status === "ordered" && (
          <form action={receivePurchaseOrder}>
            <input type="hidden" name="poId" value={po.id} />
            <Button type="submit">Receive → create lots</Button>
          </form>
        )}
        {po.status === "received" && <p>✅ Received. Inventory lots were created.</p>}
      </div>
    </div>
  )
}
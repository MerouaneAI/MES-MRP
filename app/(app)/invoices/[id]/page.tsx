import { notFound } from "next/navigation"
import Link from "next/link"
import { asc, eq } from "drizzle-orm"
import { ListPlus } from "lucide-react"
import { db } from "@/db"
import { invoices, invoiceLines } from "@/db/schema/invoices"
import { parties } from "@/db/schema/parties"
import { items, lots } from "@/db/schema/inventory"
import { issueInvoice, deliverInvoice, returnInvoice, removeInvoiceLine } from "@/app/actions/invoices"
import { AddInvoiceLineForm } from "../add-line-form"
import {
  PageHeader, Panel, Table, THead, TH, TBody, TR, TD,
  StatusBadge, EmptyState, Button, buttonClass,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

export const dynamic = "force-dynamic"

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id))
  if (!invoice) notFound()

  const [customer] = await db.select().from(parties).where(eq(parties.id, invoice.partyId))
  
  const lines = await db
    .select({
      id: invoiceLines.id,
      quantity: invoiceLines.quantity,
      unitPrice: invoiceLines.unitPrice,
      lineTotal: invoiceLines.lineTotal,
      itemName: items.name,
      itemSku: items.sku,
      lotNumber: lots.lotNumber,
    })
    .from(invoiceLines)
    .innerJoin(items, eq(invoiceLines.itemId, items.id))
    .leftJoin(lots, eq(invoiceLines.lotId, lots.id))
    .where(eq(invoiceLines.invoiceId, id))

  const itemOptions = await db
    .select({ id: items.id, name: items.name, sku: items.sku })
    .from(items)
    .where(eq(items.kind, "finished_good"))
    .orderBy(asc(items.name))

  const editable = invoice.status === "draft"

  return (
    <div className="space-y-6">
      <a href="/invoices" className={buttonClass({ variant: "ghost", size: "sm" })}>← Back to invoices</a>
      <PageHeader
        title={`Invoice ${invoice.invoiceNo}`}
        description={`Customer: ${customer?.name ?? "—"} · Total: ${invoice.totalAmount} DZD`}
        actions={<StatusBadge status={invoice.status} />}
      />

      <Panel title="Lines">
        {lines.length === 0 ? (
          <EmptyState icon={ListPlus} title="No lines yet" description="Add items to this invoice." />
        ) : (
          <Reveal>
            <Table>
              <THead>
                <TH>Item</TH>
                <TH>Lot allocated</TH>
                <TH className="text-right">Qty</TH>
                <TH className="text-right">Unit price</TH>
                <TH className="text-right">Line total</TH>
                {editable && <TH className="text-right">Actions</TH>}
              </THead>
              <TBody>
                {lines.map((l) => (
                  <TR key={l.id}>
                    <TD className="font-medium">{l.itemName} <span className="text-ink-muted">({l.itemSku})</span></TD>
                    <TD className="text-ink-faint">{l.lotNumber || "—"}</TD>
                    <TD align="right">{l.quantity}</TD>
                    <TD align="right">{l.unitPrice}</TD>
                    <TD align="right">{l.lineTotal}</TD>
                    {editable && (
                      <TD align="right">
                        <form action={removeInvoiceLine}>
                          <input type="hidden" name="lineId" value={l.id} />
                          <input type="hidden" name="invoiceId" value={invoice.id} />
                          <Button type="submit" variant="danger" size="sm">Remove</Button>
                        </form>
                      </TD>
                    )}
                  </TR>
                ))}
              </TBody>
            </Table>
          </Reveal>
        )}
      </Panel>

      {editable && <AddInvoiceLineForm invoiceId={invoice.id} items={itemOptions} />}

      <div className="flex gap-3">
        {invoice.status === "draft" && (
          <form action={issueInvoice}>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <Button type="submit">Issue invoice</Button>
          </form>
        )}
        {invoice.status === "issued" && (
          <form action={deliverInvoice}>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <Button type="submit">Deliver → deduct inventory</Button>
          </form>
        )}
        {invoice.status === "delivered" && (
          <form action={returnInvoice}>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <Button type="submit" variant="danger">Retour → restore inventory</Button>
          </form>
        )}
        {invoice.status === "returned" && <p className="text-sm text-ink-muted">Returned. Inventory restored.</p>}
      </div>
    </div>
  )
}

// app/invoices/page.tsx
import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { FileText } from "lucide-react"
import { db } from "@/db"
import { invoices } from "@/db/schema/invoices"
import { parties } from "@/db/schema/parties"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import {
  PageHeader, Table, THead, TH, TBody, TR, TD,
  EmptyState, buttonClass,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

export const dynamic = "force-dynamic"

export default async function InvoicesPage() {
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  const rows = await db
    .select({
      id: invoices.id,
      invoiceNo: invoices.invoiceNo,
      totalAmount: invoices.totalAmount,
      issuedAt: invoices.issuedAt,
      partyName: parties.name,
    })
    .from(invoices)
    .innerJoin(parties, eq(invoices.partyId, parties.id))
    .orderBy(desc(invoices.issuedAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Gapless-numbered invoices in DZD."
        actions={canWrite ? <Link href="/invoices/new" className={buttonClass()}>+ New invoice</Link> : undefined}
      />
      {/* No edit/delete links: invoices are immutable by design. */}
      {rows.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices yet" description="Issue your first invoice to a customer."
          action={canWrite ? <Link href="/invoices/new" className={buttonClass({ size: "sm" })}>+ New invoice</Link> : undefined} />
      ) : (
        <Reveal className="card p-2">
          <Table>
            <THead><TH>Invoice #</TH><TH>Customer</TH><TH className="text-right">Total (DZD)</TH><TH>Issued</TH></THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-medium">{r.invoiceNo}</TD>
                  <TD>{r.partyName}</TD>
                  <TD align="right">{r.totalAmount}</TD>
                  <TD className="text-ink-muted">{new Date(r.issuedAt).toISOString().slice(0, 10)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Reveal>
      )}
    </div>
  )
}
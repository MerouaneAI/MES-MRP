// app/invoices/page.tsx
import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { invoices } from "@/db/schema/invoices"
import { parties } from "@/db/schema/parties"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { PageHeader } from "@/components/ui/page-header"
import { buttonClass } from "@/components/ui/button"
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { FileText } from "lucide-react"

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
        actions={canWrite ? <Link href="/invoices/new" className={buttonClass()}>+ New invoice</Link> : undefined}
      />
      {/* No edit/delete links: invoices are immutable by design. */}
      {rows.length === 0 ? <EmptyState icon={FileText} title="No invoices yet" description="Issue your first invoice to a customer." action={canWrite ? <Link href="/invoices/new" className={buttonClass()}>+ New invoice</Link> : undefined} /> : (
        <Table>
          <THead><TH>Invoice #</TH><TH>Customer</TH><TH className="text-right">Total (DZD)</TH><TH>Issued</TH></THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD>{r.invoiceNo}</TD>
                <TD>{r.partyName}</TD>
                <TD align="right">{r.totalAmount}</TD>
                <TD>{new Date(r.issuedAt).toISOString().slice(0, 10)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  )
}
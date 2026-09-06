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
      {rows.length === 0 ? <p>No invoices yet.</p> : (
        <table cellPadding={8} style={{ borderCollapse: "collapse", marginTop: 16 }}>
          <thead><tr><th align="left">Invoice #</th><th align="left">Customer</th><th align="right">Total (DZD)</th><th align="left">Issued</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{r.invoiceNo}</td>
                <td>{r.partyName}</td>
                <td align="right">{r.totalAmount}</td>
                <td>{new Date(r.issuedAt).toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
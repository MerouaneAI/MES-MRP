// app/invoices/page.tsx
import Link from "next/link"
import { desc, eq, ilike, or } from "drizzle-orm"
import { FileText } from "lucide-react"
import { db } from "@/db"
import { invoices } from "@/db/schema/invoices"
import { parties } from "@/db/schema/parties"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import {
  PageHeader, Table, THead, TH, TBody, TR, TD,
  EmptyState, buttonClass, SearchInput, StatusBadge, SelectFilter
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

export const dynamic = "force-dynamic"

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ q?: string, status?: string }> }) {
  const { q, status } = await searchParams
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  
  const query = db
    .select({
      id: invoices.id,
      invoiceNo: invoices.invoiceNo,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      issuedAt: invoices.issuedAt,
      partyName: parties.name,
    })
    .from(invoices)
    .innerJoin(parties, eq(invoices.partyId, parties.id))

  if (q) {
    query.where(or(ilike(invoices.invoiceNo, `%${q}%`), ilike(parties.name, `%${q}%`)))
  }
  if (status) {
    query.where(eq(invoices.status, status as any))
  }

  const rows = await query.orderBy(desc(invoices.issuedAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Gapless-numbered invoices in DZD."
        actions={
          <>
            <SelectFilter 
              paramName="status" 
              placeholder="All statuses"
              options={[
                { label: "Draft", value: "draft" },
                { label: "Issued", value: "issued" },
                { label: "Delivered", value: "delivered" },
                { label: "Returned", value: "returned" },
              ]} 
            />
            <SearchInput placeholder="Search invoices..." />
            {canWrite && <Link href="/invoices/new" className={buttonClass()}>+ New invoice</Link>}
          </>
        }
      />
      {/* No edit/delete links: invoices are immutable by design. */}
      {rows.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices yet" description="Issue your first invoice to a customer."
          action={canWrite ? <Link href="/invoices/new" className={buttonClass({ size: "sm" })}>+ New invoice</Link> : undefined} />
      ) : (
        <Reveal className="card p-2">
          <Table>
            <THead><TH>Invoice #</TH><TH>Customer</TH><TH>Status</TH><TH className="text-right">Total (DZD)</TH><TH>Date</TH><TH /></THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-medium">{r.invoiceNo}</TD>
                  <TD>{r.partyName}</TD>
                  <TD><StatusBadge status={r.status} /></TD>
                  <TD align="right">{r.totalAmount}</TD>
                  <TD className="text-ink-muted">{new Date(r.issuedAt).toISOString().slice(0, 10)}</TD>
                  <TD><Link href={`/invoices/${r.id}`} className={buttonClass({ variant: "ghost", size: "sm" })}>Open</Link></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Reveal>
      )}
    </div>
  )
}
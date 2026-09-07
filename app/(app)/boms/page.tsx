import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { boms } from "@/db/schema/production"
import { items } from "@/db/schema/inventory"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { PageHeader } from "@/components/ui/page-header"
import { buttonClass } from "@/components/ui/button"
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function BomsPage() {
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  const rows = await db
    .select({ id: boms.id, version: boms.version, status: boms.status, productName: items.name, productSku: items.sku })
    .from(boms)
    .innerJoin(items, eq(boms.productItemId, items.id))
    .orderBy(desc(boms.createdAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills of materials"
        actions={canWrite ? <Link href="/boms/new" className={buttonClass()}>+ New BOM</Link> : undefined}
      />
      {rows.length === 0 ? <p>No BOMs yet.</p> : (
        <Table>
          <THead><TH>Product</TH><TH className="text-right">Version</TH><TH>Status</TH><TH /></THead>
          <TBody>
            {rows.map((b) => (
              <TR key={b.id}>
                <TD>{b.productName} <span className="text-ink-muted">({b.productSku})</span></TD>
                <TD align="right">v{b.version}</TD>
                <TD><StatusBadge status={b.status} /></TD>
                <TD><Link href={`/boms/${b.id}`}>Open</Link></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  )
}

import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { ClipboardList } from "lucide-react"
import { db } from "@/db"
import { boms } from "@/db/schema/production"
import { items } from "@/db/schema/inventory"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import {
  PageHeader, Table, THead, TH, TBody, TR, TD,
  StatusBadge, EmptyState, buttonClass,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

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
        description="Product recipes and component lists."
        actions={canWrite ? <Link href="/boms/new" className={buttonClass()}>+ New BOM</Link> : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No BOMs yet" description="Create a bill of materials for a product."
          action={canWrite ? <Link href="/boms/new" className={buttonClass({ size: "sm" })}>+ New BOM</Link> : undefined} />
      ) : (
        <Reveal className="card p-2">
          <Table>
            <THead><TH>Product</TH><TH className="text-right">Version</TH><TH>Status</TH><TH /></THead>
            <TBody>
              {rows.map((b) => (
                <TR key={b.id}>
                  <TD className="font-medium">{b.productName} <span className="text-ink-muted font-normal">({b.productSku})</span></TD>
                  <TD align="right">v{b.version}</TD>
                  <TD><StatusBadge status={b.status} /></TD>
                  <TD><Link href={`/boms/${b.id}`} className={buttonClass({ variant: "ghost", size: "sm" })}>Open</Link></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Reveal>
      )}
    </div>
  )
}

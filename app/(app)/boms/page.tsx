import Link from "next/link"
import { reactivateBom } from "@/app/actions/boms"
import { desc, eq, ilike, or } from "drizzle-orm"
import { ClipboardList } from "lucide-react"
import { db } from "@/db"
import { boms } from "@/db/schema/production"
import { items } from "@/db/schema/inventory"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import {
  PageHeader, Table, THead, TH, TBody, TR, TD,
  StatusBadge, EmptyState, buttonClass, SearchInput, Button,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

export const dynamic = "force-dynamic"

export default async function BomsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  const isAdmin = !!user && can(user.role, "admin")
  
  const query = db
    .select({ id: boms.id, version: boms.version, status: boms.status, productName: items.name, productSku: items.sku })
    .from(boms)
    .innerJoin(items, eq(boms.productItemId, items.id))

  if (q) {
    query.where(or(ilike(items.name, `%${q}%`), ilike(items.sku, `%${q}%`)))
  }

  const rows = await query.orderBy(desc(boms.createdAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills of materials"
        description="Product recipes and component lists."
        actions={
          <>
            <SearchInput placeholder="Search BOMs..." />
            {canWrite && <Link href="/boms/new" className={buttonClass()}>+ New BOM</Link>}
          </>
        }
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
                  <TD>
                    <div className="flex justify-end gap-2 items-center">
                      {b.status === "archived" && isAdmin && (
                        <form action={reactivateBom}>
                          <input type="hidden" name="bomId" value={b.id} />
                          <Button type="submit" variant="secondary" size="sm">Reactivate</Button>
                        </form>
                      )}
                      <Link href={`/boms/${b.id}`} className={buttonClass({ variant: "ghost", size: "sm" })}>Open</Link>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Reveal>
      )}
    </div>
  )
}

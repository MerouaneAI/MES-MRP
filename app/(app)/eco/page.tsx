import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { GitBranch } from "lucide-react"
import { db } from "@/db"
import { engineeringChangeOrders, boms } from "@/db/schema/production"
import { items } from "@/db/schema/inventory"
import { applyEco, cancelEco } from "@/app/actions/eco"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import {
  PageHeader, Table, THead, TH, TBody, TR, TD,
  StatusBadge, EmptyState, Button, buttonClass,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

export const dynamic = "force-dynamic"

export default async function EcoPage() {
  const user = await currentUser()
  const isAdmin = !!user && can(user.role, "admin")
  const rows = await db
    .select({
      id: engineeringChangeOrders.id,
      reason: engineeringChangeOrders.reason,
      status: engineeringChangeOrders.status,
      productName: items.name,
      toVersion: boms.version,
    })
    .from(engineeringChangeOrders)
    .innerJoin(items, eq(engineeringChangeOrders.productItemId, items.id))
    .innerJoin(boms, eq(engineeringChangeOrders.toBomId, boms.id))
    .orderBy(desc(engineeringChangeOrders.createdAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Engineering change orders"
        description="Manage recipe version changes."
        actions={isAdmin ? <Link href="/eco/new" className={buttonClass()}>+ New ECO</Link> : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState icon={GitBranch} title="No ECOs yet" description="Create one to manage recipe changes."
          action={isAdmin ? <Link href="/eco/new" className={buttonClass({ size: "sm" })}>+ New ECO</Link> : undefined} />
      ) : (
        <Reveal className="card p-2">
          <Table>
            <THead><TH>Product</TH><TH>Target</TH><TH>Reason</TH><TH>Status</TH><TH className="text-right">Actions</TH></THead>
            <TBody>
              {rows.map((e) => (
                <TR key={e.id}>
                  <TD className="font-medium">{e.productName}</TD>
                  <TD>v{e.toVersion}</TD>
                  <TD className="text-ink-muted">{e.reason}</TD>
                  <TD><StatusBadge status={e.status} /></TD>
                  <TD align="right">
                    <div className="flex justify-end gap-2">
                      {e.status === "draft" && isAdmin && (
                        <>
                          <form action={applyEco}>
                            <input type="hidden" name="ecoId" value={e.id} />
                            <Button type="submit" size="sm">Apply</Button>
                          </form>
                          <form action={cancelEco}>
                            <input type="hidden" name="ecoId" value={e.id} />
                            <Button type="submit" variant="danger" size="sm">Cancel</Button>
                          </form>
                        </>
                      )}
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

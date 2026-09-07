import Link from "next/link"
import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { lots, items } from "@/db/schema/inventory"
import { deleteLot } from "@/app/actions/lots"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { PageHeader } from "@/components/ui/page-header"
import { buttonClass } from "@/components/ui/button"
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table"

export const dynamic = "force-dynamic"

function expiryBadge(expiresAt: string | null) {
  if (!expiresAt) return { label: "—", color: "#666" }
  const today = new Date().toISOString().slice(0, 10)
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  if (expiresAt < today) return { label: `Expired (${expiresAt})`, color: "crimson" }
  if (expiresAt <= in30) return { label: `Expiring soon (${expiresAt})`, color: "darkorange" }
  return { label: expiresAt, color: "green" }
}

export default async function LotsPage() {
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  const canDelete = !!user && can(user.role, "admin")
  // FEFO: earliest expiry first. Postgres sorts NULLs LAST on ASC, so no-expiry
  // lots are consumed last — exactly what we want.
  const rows = await db
    .select({
      id: lots.id,
      lotNumber: lots.lotNumber,
      quantityOnHand: lots.quantityOnHand,
      expiresAt: lots.expiresAt,
      itemName: items.name,
      itemSku: items.sku,
      unit: items.unit,
    })
    .from(lots)
    .innerJoin(items, eq(lots.itemId, items.id))
    .orderBy(asc(lots.expiresAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory (lots)"
        actions={canWrite ? <Link href="/lots/new" className={buttonClass()}>+ Add lot</Link> : undefined}
      />
      {rows.length === 0 ? <p>No lots yet.</p> : (
        <Table>
          <THead><TH>Item</TH><TH>Lot #</TH><TH className="text-right">On hand</TH><TH>Expiry (FEFO)</TH><TH /></THead>
          <TBody>
            {rows.map((l) => {
              const badge = expiryBadge(l.expiresAt)
              return (
                <TR key={l.id}>
                  <TD>{l.itemName} <span className="text-ink-muted">({l.itemSku})</span></TD>
                  <TD>{l.lotNumber}</TD>
                  <TD align="right">{l.quantityOnHand} {l.unit}</TD>
                  <TD><span style={{ color: badge.color }}>{badge.label}</span></TD>
                  <TD className="flex items-center gap-2">
                    {canWrite && <Link href={`/lots/${l.id}/edit`}>Edit</Link>}
                    {canDelete && (
                      <form action={deleteLot}>
                        <input type="hidden" name="id" value={l.id} />
                        <button type="submit">Delete</button>
                      </form>
                    )}
                  </TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      )}
    </div>
  )
}
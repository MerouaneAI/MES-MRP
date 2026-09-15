import Link from "next/link"
import { redirect } from "next/navigation"
import { asc, eq, ilike, or, inArray, and } from "drizzle-orm"
import { Boxes } from "lucide-react"
import { db } from "@/db"
import { lots, items } from "@/db/schema/inventory"
import { deleteLot } from "@/app/actions/lots"
import { authorize } from "@/lib/authz"
import {
  PageHeader, Table, THead, TH, TBody, TR, TD,
  EmptyState, Button, buttonClass, SearchInput, SelectFilter,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

export const dynamic = "force-dynamic"

function expiryBadge(expiresAt: string | null) {
  if (!expiresAt) return { label: "—", className: "text-ink-muted" }
  const today = new Date().toISOString().slice(0, 10)
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  if (expiresAt < today) return { label: `Expired (${expiresAt})`, className: "text-danger" }
  if (expiresAt <= in30) return { label: `Expiring soon (${expiresAt})`, className: "text-gold" }
  return { label: expiresAt, className: "text-success" }
}

export default async function LotsPage({ searchParams }: { searchParams: Promise<{ q?: string, kind?: "raw_material" | "finished_good" }> }) {
  const { q, kind } = await searchParams
  
  const gate = await authorize("lots", "view")
  if (!gate.ok) redirect("/forbidden")
  const canWrite = gate.permission?.canWrite ?? false
  const canDelete = gate.permission?.canDelete ?? false
  const dataFilter = gate.permission?.dataFilter
  // FEFO: earliest expiry first. Postgres sorts NULLs LAST on ASC, so no-expiry
  // lots are consumed last — exactly what we want.
  const query = db
    .select({
      id: lots.id,
      lotNumber: lots.lotNumber,
      quantityOnHand: lots.quantityOnHand,
      expiresAt: lots.expiresAt,
      itemName: items.name,
      itemSku: items.sku,
      unit: items.unit,
      kind: items.kind,
    })
    .from(lots)
    .innerJoin(items, eq(lots.itemId, items.id))

  const filters: import("drizzle-orm").SQL[] = []
  if (dataFilter?.itemKind && dataFilter.itemKind.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters.push(inArray(items.kind, dataFilter.itemKind as any))
  }
  if (q) {
    filters.push(or(ilike(lots.lotNumber, `%${q}%`), ilike(items.name, `%${q}%`), ilike(items.sku, `%${q}%`))!)
  }
  if (kind) {
    filters.push(eq(items.kind, kind))
  }
  if (filters.length > 0) {
    query.where(and(...filters))
  }

  const rows = await query.orderBy(asc(lots.expiresAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory (lots)"
        description="Lot-based inventory with FEFO tracking."
        actions={
          <>
            <SelectFilter
              paramName="kind"
              placeholder="All kinds"
              options={[
                { label: "Raw Material", value: "raw_material" },
                { label: "Finished Good", value: "finished_good" },
              ]}
            />
            <SearchInput placeholder="Search lots..." />
            {canWrite && <Link href="/lots/new" className={buttonClass()}>+ Add lot</Link>}
          </>
        }
      />
      {rows.length === 0 ? (
        <EmptyState icon={Boxes} title="No lots yet" description="Create a lot or receive a purchase order."
          action={canWrite ? <Link href="/lots/new" className={buttonClass({ size: "sm" })}>+ Add lot</Link> : undefined} />
      ) : (
        <Reveal className="card p-2">
          <Table>
            <THead><TH>Item</TH><TH>Lot #</TH><TH className="text-right">On hand</TH><TH>Expiry (FEFO)</TH><TH className="text-right">Actions</TH></THead>
            <TBody>
              {rows.map((l) => {
                const badge = expiryBadge(l.expiresAt)
                return (
                  <TR key={l.id}>
                    <TD>{l.itemName} <span className="text-ink-muted">({l.itemSku})</span></TD>
                    <TD className="font-medium">{l.lotNumber}</TD>
                    <TD align="right">{l.quantityOnHand} {l.unit}</TD>
                    <TD><span className={badge.className}>{badge.label}</span></TD>
                    <TD align="right">
                      <div className="flex justify-end gap-2">
                        {canWrite && <Link href={`/lots/${l.id}/edit`} className={buttonClass({ variant: "ghost", size: "sm" })}>Edit</Link>}
                        {canDelete && (
                          <form action={deleteLot}>
                            <input type="hidden" name="id" value={l.id} />
                            <Button type="submit" variant="danger" size="sm">Delete</Button>
                          </form>
                        )}
                      </div>
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        </Reveal>
      )}
    </div>
  )
}
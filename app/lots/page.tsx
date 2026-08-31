import Link from "next/link"
import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { lots, items } from "@/db/schema/inventory"
import { deleteLot } from "@/app/actions/lots"
import { Nav } from "@/components/nav"

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
    <main style={{ padding: 24 }}>
      <Nav />
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Inventory (lots)</h1>
        <Link href="/lots/new">+ Add lot</Link>
      </header>
      {rows.length === 0 ? <p>No lots yet.</p> : (
        <table cellPadding={8} style={{ borderCollapse: "collapse", marginTop: 16 }}>
          <thead><tr><th align="left">Item</th><th align="left">Lot #</th><th align="right">On hand</th><th align="left">Expiry (FEFO)</th><th /></tr></thead>
          <tbody>
            {rows.map((l) => {
              const badge = expiryBadge(l.expiresAt)
              return (
                <tr key={l.id} style={{ borderTop: "1px solid #ddd" }}>
                  <td>{l.itemName} <span style={{ color: "#999" }}>({l.itemSku})</span></td>
                  <td>{l.lotNumber}</td>
                  <td align="right">{l.quantityOnHand} {l.unit}</td>
                  <td style={{ color: badge.color }}>{badge.label}</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <Link href={`/lots/${l.id}/edit`}>Edit</Link>
                    <form action={deleteLot}>
                      <input type="hidden" name="id" value={l.id} />
                      <button type="submit">Delete</button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </main>
  )
}
// app/items/page.tsx
import Link from "next/link"
import { desc } from "drizzle-orm"
import { db } from "@/db"
import { items } from "@/db/schema/inventory"
import { deleteItem } from "@/app/actions/items"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"

export const dynamic = "force-dynamic"

export default async function ItemsPage() {
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  const canDelete = !!user && can(user.role, "admin")
  const rows = await db.select().from(items).orderBy(desc(items.createdAt))
  return (
    <div className="space-y-6">
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Items</h1>
        {canWrite && <Link href="/items/new">+ Add item</Link>}
      </header>
      {rows.length === 0 ? <p>No items yet.</p> : (
        <table cellPadding={8} style={{ borderCollapse: "collapse", marginTop: 16 }}>
          <thead><tr><th align="left">SKU</th><th align="left">Name</th><th align="left">Kind</th><th align="left">Unit</th><th /></tr></thead>
          <tbody>
            {rows.map((it) => (
              <tr key={it.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{it.sku}</td>
                <td>{it.name}</td>
                <td>{it.kind}</td>
                <td>{it.unit}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  {canWrite && <Link href={`/items/${it.id}/edit`}>Edit</Link>}
                  {canDelete && (
                    <form action={deleteItem}>
                      <input type="hidden" name="id" value={it.id} />
                      <button type="submit">Delete</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
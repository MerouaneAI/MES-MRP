import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { boms } from "@/db/schema/production"
import { items } from "@/db/schema/inventory"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { PageHeader } from "@/components/ui/page-header"
import { buttonClass } from "@/components/ui/button"

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
        <table cellPadding={8} style={{ borderCollapse: "collapse", marginTop: 16 }}>
          <thead><tr><th align="left">Product</th><th align="right">Version</th><th align="left">Status</th><th /></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{b.productName} <span style={{ color: "#999" }}>({b.productSku})</span></td>
                <td align="right">v{b.version}</td>
                <td>{b.status}</td>
                <td><Link href={`/boms/${b.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

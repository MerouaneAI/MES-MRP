import { redirect } from "next/navigation"
import { desc } from "drizzle-orm"
import { db } from "@/db"
import { auditLog } from "@/db/schema/audit"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"

export const dynamic = "force-dynamic"

export default async function AuditPage() {
  const me = await currentUser()
  if (!me || !can(me.role, "admin")) redirect("/forbidden")

  const rows = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(200)

  return (
    <div className="space-y-6">
      <h1>Audit log</h1>
      <p style={{ color: "#666" }}>Most recent 200 events.</p>
      <table cellPadding={8} style={{ borderCollapse: "collapse", marginTop: 12 }}>
        <thead><tr><th align="left">When</th><th align="left">User</th><th align="left">Action</th><th align="left">Summary</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderTop: "1px solid #ddd" }}>
              <td>{new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 19)}</td>
              <td>{r.userEmail ?? "system"}</td>
              <td>{r.action}</td>
              <td>{r.summary ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
import { redirect } from "next/navigation"
import { desc } from "drizzle-orm"
import { db } from "@/db"
import { auditLog } from "@/db/schema/audit"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { PageHeader, Table, THead, TH, TBody, TR, TD } from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

export const dynamic = "force-dynamic"

export default async function AuditPage() {
  const me = await currentUser()
  if (!me || !can(me.role, "admin")) redirect("/forbidden")

  const rows = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(200)

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Most recent 200 events." />
      <Reveal className="card p-2">
        <Table>
          <THead><TH>When</TH><TH>User</TH><TH>Action</TH><TH>Summary</TH></THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD className="text-ink-muted">{new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 19)}</TD>
                <TD className="font-medium">{r.userEmail ?? "system"}</TD>
                <TD>{r.action}</TD>
                <TD>{r.summary ?? "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Reveal>
    </div>
  )
}
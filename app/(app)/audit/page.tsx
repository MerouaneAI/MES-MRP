import { redirect } from "next/navigation"
import { desc, ilike, or } from "drizzle-orm"
import { db } from "@/db"
import { auditLog } from "@/db/schema/audit"
import { authorize } from "@/lib/authz"
import { PageHeader, Table, THead, TH, TBody, TR, TD, SearchInput } from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

export const dynamic = "force-dynamic"

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const gate = await authorize("audit", "view")
  if (!gate.ok) redirect("/forbidden")

  const query = db.select().from(auditLog)
  if (q) {
    query.where(or(ilike(auditLog.userEmail, `%${q}%`), ilike(auditLog.action, `%${q}%`), ilike(auditLog.summary, `%${q}%`)))
  }
  const rows = await query.orderBy(desc(auditLog.createdAt)).limit(200)

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Audit log" 
        description="Most recent 200 events." 
        actions={<SearchInput placeholder="Search logs..." />}
      />
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
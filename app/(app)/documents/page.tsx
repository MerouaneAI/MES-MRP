import { asc, desc } from "drizzle-orm"
import { db } from "@/db"
import { documents } from "@/db/schema/documents"
import { purchaseOrders } from "@/db/schema/purchases"
import { lots } from "@/db/schema/inventory"
import { enqueuePoPdf, enqueueCoaPdf } from "@/app/actions/documents"
import { currentUser } from "@/lib/session"
import { can } from "@/lib/authz"
import { PageHeader } from "@/components/ui/page-header"
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Field, Select } from "@/components/ui/field"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function DocumentsPage() {
  const user = await currentUser()
  const canWrite = !!user && can(user.role, "operator")
  const docs = await db.select().from(documents).orderBy(desc(documents.createdAt))
  const poOptions = await db.select({ id: purchaseOrders.id }).from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt))
  const lotOptions = await db.select({ id: lots.id, lotNumber: lots.lotNumber }).from(lots).orderBy(asc(lots.lotNumber))

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" />

      {canWrite && (
        <div className="flex flex-wrap gap-6 mb-6">
          <form action={enqueuePoPdf} className="flex items-end gap-2">
            <Field label="PO PDF">
              <Select name="poId" required defaultValue="">
                <option value="" disabled>Choose PO…</option>
                {poOptions.map((p) => <option key={p.id} value={p.id}>{p.id.slice(0, 8)}</option>)}
              </Select>
            </Field>
            <Button type="submit" size="sm">Generate PO PDF</Button>
          </form>

          <form action={enqueueCoaPdf} className="flex items-end gap-2">
            <Field label="CoA PDF">
              <Select name="lotId" required defaultValue="">
                <option value="" disabled>Choose lot…</option>
                {lotOptions.map((l) => <option key={l.id} value={l.id}>{l.lotNumber}</option>)}
              </Select>
            </Field>
            <Button type="submit" size="sm">Generate CoA PDF</Button>
          </form>
        </div>
      )}

      {docs.length === 0 ? <p>No documents yet. Generate one above.</p> : (
        <Table>
          <THead><TH>Kind</TH><TH>Ref</TH><TH>Status</TH><TH /></THead>
          <TBody>
            {docs.map((d) => (
              <TR key={d.id}>
                <TD><Badge>{d.kind}</Badge></TD>
                <TD>{d.refId.slice(0, 8)}</TD>
                <TD><StatusBadge status={d.status} />{d.error ? ` — ${d.error}` : ""}</TD>
                <TD>{d.status === "done" ? <a href={`/api/documents/${d.id}`}>Download</a> : "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <p style={{ color: "#666", marginTop: 16, fontSize: 13 }}>
        Jobs are processed by the worker (<code>npm run worker</code>). Refresh after a moment to see the status change to “done”.
      </p>
    </div>
  )
}

import Link from "next/link"
import { redirect } from "next/navigation"
import { desc, ilike, or, eq, inArray, and } from "drizzle-orm"
import { Users } from "lucide-react"
import { db } from "@/db"
import { parties } from "@/db/schema/parties"
import { deleteParty } from "@/app/actions/parties"
import { authorize } from "@/lib/authz"
import {
  PageHeader, Table, THead, TH, TBody, TR, TD,
  StatusBadge, EmptyState, Button, buttonClass, SearchInput, SelectFilter,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

export const dynamic = "force-dynamic"

export default async function PartiesPage({ searchParams }: { searchParams: Promise<{ q?: string, type?: "customer" | "supplier" | "both" }> }) {
  const { q, type } = await searchParams
  
  const gate = await authorize("parties", "view")
  if (!gate.ok) redirect("/forbidden")
  const canWrite = gate.permission?.canWrite ?? false
  const canDelete = gate.permission?.canDelete ?? false
  const dataFilter = gate.permission?.dataFilter
  
  const query = db.select().from(parties)
  
  const filters: import("drizzle-orm").SQL[] = []
  if (dataFilter?.partyType && dataFilter.partyType.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters.push(inArray(parties.type, dataFilter.partyType as any))
  }

  if (q) {
    filters.push(or(ilike(parties.name, `%${q}%`), ilike(parties.phone, `%${q}%`), ilike(parties.nif, `%${q}%`))!)
  }
  if (type) {
    filters.push(eq(parties.type, type))
  }
  if (filters.length > 0) {
    query.where(and(...filters))
  }
  const rows = await query.orderBy(desc(parties.createdAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parties"
        description="Customers, suppliers, and contacts."
        actions={
          <>
            <SelectFilter
              paramName="type"
              placeholder="All types"
              options={[
                { label: "Customer", value: "customer" },
                { label: "Supplier", value: "supplier" },
                { label: "Both", value: "both" },
              ]}
            />
            <SearchInput placeholder="Search parties..." />
            {canWrite && <Link href="/parties/new" className={buttonClass()}>+ Add party</Link>}
          </>
        }
      />

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No parties yet" description="Add your first customer or supplier."
          action={canWrite ? <Link href="/parties/new" className={buttonClass({ size: "sm" })}>+ Add party</Link> : undefined} />
      ) : (
        <Reveal className="card p-2">
          <Table>
            <THead>
              <TH>Name</TH><TH>Type</TH><TH>Phone</TH><TH>NIF</TH><TH className="text-right">Actions</TH>
            </THead>
            <TBody>
              {rows.map((p) => (
                <TR key={p.id}>
                  <TD className="font-medium">{p.name}</TD>
                  <TD><StatusBadge status={p.type} /></TD>
                  <TD className="text-ink-muted">{p.phone ?? "—"}</TD>
                  <TD className="text-ink-muted">{p.nif ?? "—"}</TD>
                  <TD align="right">
                    <div className="flex justify-end gap-2">
                      {canWrite && <Link href={`/parties/${p.id}/edit`} className={buttonClass({ variant: "ghost", size: "sm" })}>Edit</Link>}
                      {canDelete && (
                        <form action={deleteParty}>
                          <input type="hidden" name="id" value={p.id} />
                          <Button type="submit" variant="danger" size="sm">Delete</Button>
                        </form>
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

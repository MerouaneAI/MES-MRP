// app/items/page.tsx
import Link from "next/link"
import { redirect } from "next/navigation"
import { desc, ilike, or, eq, inArray, and } from "drizzle-orm"
import { Package } from "lucide-react"
import { db } from "@/db"
import { items } from "@/db/schema/inventory"
import { deleteItem } from "@/app/actions/items"
import { authorize } from "@/lib/authz"
import {
  PageHeader, Table, THead, TH, TBody, TR, TD,
  StatusBadge, EmptyState, Button, buttonClass, SearchInput, SelectFilter,
} from "@/components/ui"
import { Reveal } from "@/components/motion/reveal"

export const dynamic = "force-dynamic"

export default async function ItemsPage({ searchParams }: { searchParams: Promise<{ q?: string, kind?: "raw_material" | "finished_good" }> }) {
  const { q, kind } = await searchParams
  
  const gate = await authorize("items", "view")
  if (!gate.ok) redirect("/forbidden")
  const canWrite = gate.permission?.canWrite ?? false
  const canDelete = gate.permission?.canDelete ?? false
  const dataFilter = gate.permission?.dataFilter

  const query = db.select().from(items)
  
  const filters: import("drizzle-orm").SQL[] = []
  if (dataFilter?.itemKind && dataFilter.itemKind.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters.push(inArray(items.kind, dataFilter.itemKind as any))
  }
  if (q) {
    filters.push(or(ilike(items.name, `%${q}%`), ilike(items.sku, `%${q}%`))!)
  }
  if (kind) {
    filters.push(eq(items.kind, kind))
  }
  if (filters.length > 0) {
    query.where(and(...filters))
  }
  const rows = await query.orderBy(desc(items.createdAt))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Items"
        description="Raw materials and finished goods."
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
            <SearchInput placeholder="Search items..." />
            {canWrite && <Link href="/items/new" className={buttonClass()}>+ Add item</Link>}
          </>
        }
      />

      {rows.length === 0 ? (
        <EmptyState icon={Package} title="No items yet" description="Create your first catalog item."
          action={canWrite ? <Link href="/items/new" className={buttonClass({ size: "sm" })}>+ Add item</Link> : undefined} />
      ) : (
        <Reveal className="card p-2">
          <Table>
            <THead>
              <TH>SKU</TH><TH>Name</TH><TH>Kind</TH><TH>Unit</TH><TH className="text-right">Actions</TH>
            </THead>
            <TBody>
              {rows.map((it) => (
                <TR key={it.id}>
                  <TD className="font-medium">{it.sku}</TD>
                  <TD>{it.name}</TD>
                  <TD><StatusBadge status={it.kind} /></TD>
                  <TD className="text-ink-muted">{it.unit}</TD>
                  <TD align="right">
                    <div className="flex justify-end gap-2">
                      {canWrite && <Link href={`/items/${it.id}/edit`} className={buttonClass({ variant: "ghost", size: "sm" })}>Edit</Link>}
                      {canDelete && (
                        <form action={deleteItem}>
                          <input type="hidden" name="id" value={it.id} />
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
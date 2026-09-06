// app/items/[id]/edit/page.tsx
import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { items } from "@/db/schema/inventory"
import { updateItem } from "@/app/actions/items"
import { ItemForm } from "../../item-form"

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [item] = await db.select().from(items).where(eq(items.id, id))
  if (!item) notFound()

  const action = updateItem.bind(null, item.id)

  return (
    <div className="space-y-6">
      <h1>Edit item</h1>
      <ItemForm
        action={action}
        submitLabel="Save changes"
        defaults={{
          kind: item.kind,
          sku: item.sku,
          name: item.name,
          unit: item.unit,
          shelfLifeDays: item.shelfLifeDays != null ? String(item.shelfLifeDays) : "",
        }}
      />
    </div>
  )
}
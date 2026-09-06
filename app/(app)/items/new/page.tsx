// app/items/new/page.tsx
import { createItem } from "@/app/actions/items"
import { ItemForm } from "../item-form"
import { PageHeader } from "@/components/ui/page-header"

export default function NewItemPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add item" />
      <ItemForm action={createItem} submitLabel="Create item" />
    </div>
  )
}
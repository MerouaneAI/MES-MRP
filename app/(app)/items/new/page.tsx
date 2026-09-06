// app/items/new/page.tsx
import { createItem } from "@/app/actions/items"
import { ItemForm } from "../item-form"

export default function NewItemPage() {
  return (
    <div className="space-y-6">
      <h1>Add item</h1>
      <ItemForm action={createItem} submitLabel="Create item" />
    </div>
  )
}
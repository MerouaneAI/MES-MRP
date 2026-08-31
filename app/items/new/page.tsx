// app/items/new/page.tsx
import { createItem } from "@/app/actions/items"
import { ItemForm } from "../item-form"
import { Nav } from "@/components/nav"

export default function NewItemPage() {
  return (
    <main style={{ padding: 24 }}>
      <Nav />
      <h1>Add item</h1>
      <ItemForm action={createItem} submitLabel="Create item" />
    </main>
  )
}
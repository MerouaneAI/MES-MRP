// app/purchasing/add-line-form.tsx
"use client"

import { useActionState } from "react"
import { addPurchaseOrderLine } from "@/app/actions/purchasing"
import type { FormState } from "@/lib/types"

type ItemOption = { id: string; name: string; sku: string }

export function AddLineForm({ poId, items }: { poId: string; items: ItemOption[] }) {
  const action = addPurchaseOrderLine.bind(null, poId)
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)

  return (
    <form action={formAction} style={{ display: "flex", gap: 8, alignItems: "end", marginTop: 12, flexWrap: "wrap" }}>
      {state && !state.ok && <p style={{ color: "crimson", width: "100%" }}>{state.error}</p>}
      <label>Item
        <select name="itemId" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
        </select>
      </label>
      <label>Quantity<input name="quantity" placeholder="0.000" required /></label>
      <label>Unit price<input name="unitPrice" placeholder="0.00" required /></label>
      <button type="submit" disabled={pending}>{pending ? "Adding…" : "Add line"}</button>
    </form>
  )
}
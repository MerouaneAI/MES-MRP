"use client"

import { useActionState } from "react"
import { addBomLine } from "@/app/actions/boms"
import type { FormState } from "@/lib/types"

type ItemOption = { id: string; name: string; sku: string }

export function BomLineForm({ bomId, components }: { bomId: string; components: ItemOption[] }) {
  const action = addBomLine.bind(null, bomId)
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)

  return (
    <form action={formAction} style={{ display: "flex", gap: 8, alignItems: "end", marginTop: 12, flexWrap: "wrap" }}>
      {state && !state.ok && <p style={{ color: "crimson", width: "100%" }}>{state.error}</p>}
      <label>Component
        <select name="componentItemId" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {components.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
        </select>
      </label>
      <label>Quantity per unit<input name="quantityPer" placeholder="0.0000" required /></label>
      <button type="submit" disabled={pending}>{pending ? "Adding…" : "Add component"}</button>
    </form>
  )
}

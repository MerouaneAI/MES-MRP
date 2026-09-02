"use client"

import { useActionState } from "react"
import { createWorkOrder } from "@/app/actions/work-orders"
import type { FormState } from "@/lib/types"

type Product = { id: string; name: string; sku: string }
type WorkCenter = { id: string; name: string }

export function NewWorkOrderForm({ products, workCenters }: { products: Product[]; workCenters: WorkCenter[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createWorkOrder, null)
  return (
    <form action={formAction} style={{ display: "grid", gap: 10, maxWidth: 480 }}>
      {state && !state.ok && <p style={{ color: "crimson" }}>{state.error}</p>}
      <label>Product (with an active BOM) *
        <select name="productItemId" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
        </select>
      </label>
      <label>Quantity to produce *<input name="quantityPlanned" placeholder="0.000" required /></label>
      <label>Work center
        <select name="workCenterId" defaultValue="">
          <option value="">(none)</option>
          {workCenters.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </label>
      <label>Scheduled for<input type="date" name="scheduledFor" /></label>
      <button type="submit" disabled={pending}>{pending ? "Creating…" : "Create work order"}</button>
    </form>
  )
}

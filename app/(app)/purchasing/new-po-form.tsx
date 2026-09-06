// app/purchasing/new-po-form.tsx
"use client"

import { useActionState } from "react"
import { createPurchaseOrder } from "@/app/actions/purchasing"
import type { FormState } from "@/lib/types"

export function NewPurchaseOrderForm({ suppliers }: { suppliers: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createPurchaseOrder, null)
  return (
    <form action={formAction} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
      {state && !state.ok && <p style={{ color: "crimson" }}>{state.error}</p>}
      <label>Supplier *
        <select name="supplierId" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label>Expected date<input type="date" name="expectedAt" /></label>
      <button type="submit" disabled={pending}>{pending ? "Creating…" : "Create order"}</button>
    </form>
  )
}
"use client"

import { useActionState } from "react"
import { createBom } from "@/app/actions/boms"
import type { FormState } from "@/lib/types"

export function NewBomForm({ products }: { products: { id: string; name: string; sku: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createBom, null)
  return (
    <form action={formAction} style={{ display: "grid", gap: 10, maxWidth: 480 }}>
      {state && !state.ok && <p style={{ color: "crimson" }}>{state.error}</p>}
      <label>Product *
        <select name="productItemId" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
        </select>
      </label>
      <label>Notes<input name="notes" placeholder="optional" /></label>
      <button type="submit" disabled={pending}>{pending ? "Creating…" : "Create draft BOM"}</button>
    </form>
  )
}

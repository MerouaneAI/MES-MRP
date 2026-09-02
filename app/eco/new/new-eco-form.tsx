"use client"

import { useActionState, useState } from "react"
import { createEco } from "@/app/actions/eco"
import type { FormState } from "@/lib/types"

type Product = { productId: string; name: string; sku: string }
type Draft = { id: string; productId: string; version: number }

export function NewEcoForm({ products, drafts }: { products: Product[]; drafts: Draft[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createEco, null)
  const [productId, setProductId] = useState("")
  const options = drafts.filter((d) => d.productId === productId)

  return (
    <form action={formAction} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
      {state && !state.ok && <p style={{ color: "crimson" }}>{state.error}</p>}
      <label>Product (with an active recipe) *
        <select name="productItemId" required value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="" disabled>Choose…</option>
          {products.map((p) => <option key={p.productId} value={p.productId}>{p.name} ({p.sku})</option>)}
        </select>
      </label>
      <label>Target draft version *
        <select name="toBomId" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {options.map((d) => <option key={d.id} value={d.id}>v{d.version}</option>)}
        </select>
      </label>
      {productId && options.length === 0 && (
        <p style={{ color: "darkorange" }}>No draft version for this product yet — create one under BOMs first.</p>
      )}
      <label>Reason *<input name="reason" placeholder="e.g. supplier change, cost reduction" required /></label>
      <button type="submit" disabled={pending}>{pending ? "Creating…" : "Create ECO"}</button>
    </form>
  )
}

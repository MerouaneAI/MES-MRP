"use client"

import { useActionState, useState } from "react"
import { createEco } from "@/app/actions/eco"
import type { FormState } from "@/lib/types"
import { Field, Input, Select, Button, Card } from "@/components/ui"

type Product = { productId: string; name: string; sku: string }
type Draft = { id: string; productId: string; version: number }

export function NewEcoForm({ products, drafts }: { products: Product[]; drafts: Draft[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createEco, null)
  const [productId, setProductId] = useState("")
  const options = drafts.filter((d) => d.productId === productId)

  return (
    <Card className="max-w-lg p-6">
      <form action={formAction} className="grid gap-4">
        {state && !state.ok && <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <Field label="Product (with an active recipe)" required>
          <Select name="productItemId" required value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="" disabled>Choose…</option>
            {products.map((p) => <option key={p.productId} value={p.productId}>{p.name} ({p.sku})</option>)}
          </Select>
        </Field>

        <Field label="Target draft version" required>
          <Select name="toBomId" required defaultValue="">
            <option value="" disabled>Choose…</option>
            {options.map((d) => <option key={d.id} value={d.id}>v{d.version}</option>)}
          </Select>
        </Field>

        {productId && options.length === 0 && (
          <p className="text-gold text-sm">No draft version for this product yet — create one under BOMs first.</p>
        )}

        <Field label="Reason" required>
          <Input name="reason" placeholder="e.g. supplier change, cost reduction" required />
        </Field>

        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create ECO"}</Button>
      </form>
    </Card>
  )
}

"use client"

import { useActionState } from "react"
import { createBom } from "@/app/actions/boms"
import type { FormState } from "@/lib/types"
import { Field, Input, Select, Button, Card } from "@/components/ui"

export function NewBomForm({ products }: { products: { id: string; name: string; sku: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createBom, null)
  return (
    <Card className="max-w-lg p-6">
      <form action={formAction} className="grid gap-4">
        {state && !state.ok && <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <Field label="Product" required>
          <Select name="productItemId" required defaultValue="">
            <option value="" disabled>Choose…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </Select>
        </Field>

        <Field label="Notes" hint="Optional">
          <Input name="notes" placeholder="optional" />
        </Field>

        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create draft BOM"}</Button>
      </form>
    </Card>
  )
}

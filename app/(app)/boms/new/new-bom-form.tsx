"use client"

import { useActionState } from "react"
import { createBom } from "@/app/actions/boms"
import type { FormState } from "@/lib/types"
import { Field, Input, Select } from "@/components/ui/field"
import { Button } from "@/components/ui/button"

export function NewBomForm({ products }: { products: { id: string; name: string; sku: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createBom, null)
  return (
    <form action={formAction} className="grid gap-4 max-w-lg">
      {state && !state.ok && <p className="text-danger text-sm">{state.error}</p>}

      <Field label="Product" required>
        <Select name="productItemId" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
        </Select>
      </Field>

      <Field label="Notes">
        <Input name="notes" placeholder="optional" />
      </Field>

      <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create draft BOM"}</Button>
    </form>
  )
}

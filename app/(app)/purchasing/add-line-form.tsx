// app/purchasing/add-line-form.tsx
"use client"

import { useActionState } from "react"
import { addPurchaseOrderLine } from "@/app/actions/purchasing"
import type { FormState } from "@/lib/types"
import { Field, Input, Select } from "@/components/ui/field"
import { Button } from "@/components/ui/button"

type ItemOption = { id: string; name: string; sku: string }

export function AddLineForm({ poId, items }: { poId: string; items: ItemOption[] }) {
  const action = addPurchaseOrderLine.bind(null, poId)
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {state && !state.ok && <p className="text-danger text-sm w-full">{state.error}</p>}

      <Field label="Item">
        <Select name="itemId" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
        </Select>
      </Field>

      <Field label="Quantity">
        <Input name="quantity" placeholder="0.000" required />
      </Field>

      <Field label="Unit price">
        <Input name="unitPrice" placeholder="0.00" required />
      </Field>

      <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add line"}</Button>
    </form>
  )
}
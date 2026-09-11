// app/purchasing/new-po-form.tsx
"use client"

import { useActionState } from "react"
import { createPurchaseOrder } from "@/app/actions/purchasing"
import type { FormState } from "@/lib/types"
import { Field, Input, Select } from "@/components/ui/field"
import { Button } from "@/components/ui/button"

export function NewPurchaseOrderForm({ suppliers }: { suppliers: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createPurchaseOrder, null)
  return (
    <form action={formAction} className="grid gap-4 max-w-md">
      {state && !state.ok && <p className="text-danger text-sm">{state.error}</p>}

      <Field label="Supplier" required>
        <Select name="supplierId" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>

      <Field label="Expected date">
        <Input type="date" name="expectedAt" />
      </Field>

      <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create order"}</Button>
    </form>
  )
}
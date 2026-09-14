"use client"

import { useActionState } from "react"
import { addInvoiceLine } from "@/app/actions/invoices"
import type { FormState } from "@/lib/types"
import { Field, Input, Select, Button, Card } from "@/components/ui"

type ItemOption = { id: string; name: string; sku: string }

export function AddInvoiceLineForm({ invoiceId, items }: { invoiceId: string; items: ItemOption[] }) {
  const action = addInvoiceLine.bind(null, invoiceId)
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)

  return (
    <Card className="p-4">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        {state && !state.ok && <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger w-full">{state.error}</p>}

        <Field label="Finished Good">
          <Select name="itemId" required defaultValue="">
            <option value="" disabled>Choose…</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
          </Select>
        </Field>

        <Field label="Quantity">
          <Input name="quantity" placeholder="0.000" required />
        </Field>

        <Field label="Unit price (DZD)">
          <Input name="unitPrice" placeholder="0.00" required />
        </Field>

        <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add line"}</Button>
      </form>
    </Card>
  )
}

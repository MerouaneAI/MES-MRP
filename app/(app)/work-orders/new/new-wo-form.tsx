"use client"

import { useActionState } from "react"
import { createWorkOrder } from "@/app/actions/work-orders"
import type { FormState } from "@/lib/types"
import { Field, Input, Select, Button, Card } from "@/components/ui"

type Product = { id: string; name: string; sku: string }
type WorkCenter = { id: string; name: string }

export function NewWorkOrderForm({ products, workCenters }: { products: Product[]; workCenters: WorkCenter[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createWorkOrder, null)
  return (
    <Card className="max-w-lg p-6">
      <form action={formAction} className="grid gap-4">
        {state && !state.ok && <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <Field label="Product (with an active BOM)" required>
          <Select name="productItemId" required defaultValue="">
            <option value="" disabled>Choose…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </Select>
        </Field>

        <Field label="Quantity to produce" required>
          <Input name="quantityPlanned" placeholder="0.000" required />
        </Field>

        <Field label="Work center">
          <Select name="workCenterId" defaultValue="">
            <option value="">(none)</option>
            {workCenters.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
        </Field>

        <Field label="Scheduled for">
          <Input type="date" name="scheduledFor" />
        </Field>

        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create work order"}</Button>
      </form>
    </Card>
  )
}

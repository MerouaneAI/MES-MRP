"use client"

import { useActionState } from "react"
import { createInvoice } from "@/app/actions/invoices"
import type { FormState } from "@/lib/types"
import { Field, Input, Select, Button, Card } from "@/components/ui"

export function NewInvoiceForm({ customers }: { customers: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createInvoice, null)
  return (
    <Card className="max-w-md p-6">
      <form action={formAction} className="grid gap-4">
        {state && !state.ok && <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <Field label="Customer" required>
          <Select name="partyId" required defaultValue="">
            <option value="" disabled>Choose…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>


        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create invoice"}</Button>
      </form>
    </Card>
  )
}
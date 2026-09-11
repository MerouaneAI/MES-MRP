"use client"

import { useActionState } from "react"
import { createInvoice } from "@/app/actions/invoices"
import type { FormState } from "@/lib/types"
import { Field, Input, Select } from "@/components/ui/field"
import { Button } from "@/components/ui/button"

export function NewInvoiceForm({ customers }: { customers: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createInvoice, null)
  return (
    <form action={formAction} className="grid gap-4 max-w-md">
      {state && !state.ok && <p className="text-danger text-sm">{state.error}</p>}

      <Field label="Customer" required>
        <Select name="partyId" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>

      <Field label="Total amount (DZD)" required>
        <Input name="totalAmount" placeholder="0.00" required />
      </Field>

      <Button type="submit" disabled={pending}>{pending ? "Issuing…" : "Issue invoice"}</Button>
    </form>
  )
}
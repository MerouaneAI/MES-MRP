"use client"

import { useActionState } from "react"
import { createInvoice } from "@/app/actions/invoices"
import type { FormState } from "@/lib/types"

export function NewInvoiceForm({ customers }: { customers: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createInvoice, null)
  return (
    <form action={formAction} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
      {state && !state.ok && <p style={{ color: "crimson" }}>{state.error}</p>}
      <label>Customer *
        <select name="partyId" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label>Total amount (DZD) *<input name="totalAmount" placeholder="0.00" required /></label>
      <button type="submit" disabled={pending}>{pending ? "Issuing…" : "Issue invoice"}</button>
    </form>
  )
}
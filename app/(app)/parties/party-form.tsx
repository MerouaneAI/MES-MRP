"use client"

import Link from "next/link"
import { useActionState } from "react" // Next 14/React 18: useFormState from "react-dom"
import type { FormState } from "@/lib/types"

type Defaults = Partial<{
  type: string; name: string; phone: string; address: string
  nif: string; nis: string; rc: string; ai: string
}>

export function PartyForm({
  action,
  submitLabel,
  defaults,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  submitLabel: string
  defaults?: Defaults
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <form action={formAction} style={{ display: "grid", gap: 10, maxWidth: 480 }}>
      {state && !state.ok && <p style={{ color: "crimson" }}>{state.error}</p>}

      <label>
        Type
        <select name="type" defaultValue={defaults?.type ?? "supplier"}>
          <option value="customer">Customer</option>
          <option value="supplier">Supplier</option>
          <option value="both">Both</option>
        </select>
      </label>

      <label>
        Name *
        <input name="name" defaultValue={defaults?.name ?? ""} required />
      </label>
      {fieldErrors?.name && <span style={{ color: "crimson" }}>{fieldErrors.name[0]}</span>}

      <input name="phone" placeholder="Phone" defaultValue={defaults?.phone ?? ""} />
      <input name="address" placeholder="Address" defaultValue={defaults?.address ?? ""} />
      <input name="nif" placeholder="NIF (optional)" defaultValue={defaults?.nif ?? ""} />
      <input name="nis" placeholder="NIS (optional)" defaultValue={defaults?.nis ?? ""} />
      <input name="rc" placeholder="RC (optional)" defaultValue={defaults?.rc ?? ""} />
      <input name="ai" placeholder="AI (optional)" defaultValue={defaults?.ai ?? ""} />

      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</button>
        <Link href="/parties">Cancel</Link>
      </div>
    </form>
  )
}

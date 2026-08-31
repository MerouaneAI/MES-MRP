"use client"

import Link from "next/link"
import { useActionState } from "react"
import type { FormState } from "@/lib/types"

type ItemOption = { id: string; name: string; sku: string }
type Defaults = Partial<{ itemId: string; lotNumber: string; quantityOnHand: string; producedAt: string; expiresAt: string }>

export function LotForm({
  action,
  submitLabel,
  items,
  defaults,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  submitLabel: string
  items: ItemOption[]
  defaults?: Defaults
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <form action={formAction} style={{ display: "grid", gap: 10, maxWidth: 480 }}>
      {state && !state.ok && <p style={{ color: "crimson" }}>{state.error}</p>}

      <label>Item *
        <select name="itemId" required defaultValue={defaults?.itemId ?? ""}>
          <option value="" disabled>Choose…</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
        </select>
      </label>
      {fieldErrors?.itemId && <span style={{ color: "crimson" }}>{fieldErrors.itemId[0]}</span>}

      <label>Lot number *<input name="lotNumber" defaultValue={defaults?.lotNumber ?? ""} required /></label>
      {fieldErrors?.lotNumber && <span style={{ color: "crimson" }}>{fieldErrors.lotNumber[0]}</span>}

      <label>Quantity on hand *<input name="quantityOnHand" defaultValue={defaults?.quantityOnHand ?? ""} placeholder="0.000" required /></label>
      {fieldErrors?.quantityOnHand && <span style={{ color: "crimson" }}>{fieldErrors.quantityOnHand[0]}</span>}

      <label>Produced at<input type="date" name="producedAt" defaultValue={defaults?.producedAt ?? ""} /></label>
      <label>Expires at<input type="date" name="expiresAt" defaultValue={defaults?.expiresAt ?? ""} /></label>

      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</button>
        <Link href="/lots">Cancel</Link>
      </div>
    </form>
  )
}
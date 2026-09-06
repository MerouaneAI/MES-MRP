"use client"

import Link from "next/link"
import { useActionState } from "react"
import type { FormState } from "@/lib/types"

type Defaults = Partial<{ kind: string; sku: string; name: string; unit: string; shelfLifeDays: string }>

export function ItemForm({
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

      <label>Kind
        <select name="kind" defaultValue={defaults?.kind ?? "raw_material"}>
          <option value="raw_material">Raw material</option>
          <option value="finished_good">Finished good</option>
          <option value="wip">WIP</option>
        </select>
      </label>

      <label>SKU *<input name="sku" defaultValue={defaults?.sku ?? ""} required /></label>
      {fieldErrors?.sku && <span style={{ color: "crimson" }}>{fieldErrors.sku[0]}</span>}

      <label>Name *<input name="name" defaultValue={defaults?.name ?? ""} required /></label>
      {fieldErrors?.name && <span style={{ color: "crimson" }}>{fieldErrors.name[0]}</span>}

      <label>Unit<input name="unit" defaultValue={defaults?.unit ?? "kg"} /></label>
      <label>Shelf life (days)<input name="shelfLifeDays" defaultValue={defaults?.shelfLifeDays ?? ""} placeholder="optional" /></label>

      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</button>
        <Link href="/items">Cancel</Link>
      </div>
    </form>
  )
}
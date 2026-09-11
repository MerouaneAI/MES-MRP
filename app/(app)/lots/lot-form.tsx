"use client"

import Link from "next/link"
import { useActionState } from "react"
import type { FormState } from "@/lib/types"
import { Field, Input, Select, Button, Card } from "@/components/ui"

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
    <Card className="max-w-xl p-6">
      <form action={formAction} className="grid gap-4">
        {state && !state.ok && <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <Field label="Item" required error={fieldErrors?.itemId?.[0]}>
          <Select name="itemId" required defaultValue={defaults?.itemId ?? ""}>
            <option value="" disabled>Choose…</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
          </Select>
        </Field>

        <Field label="Lot number" required error={fieldErrors?.lotNumber?.[0]}>
          <Input name="lotNumber" defaultValue={defaults?.lotNumber ?? ""} required />
        </Field>

        <Field label="Quantity on hand" required error={fieldErrors?.quantityOnHand?.[0]}>
          <Input name="quantityOnHand" defaultValue={defaults?.quantityOnHand ?? ""} placeholder="0.000" required />
        </Field>

        <Field label="Produced at">
          <Input type="date" name="producedAt" defaultValue={defaults?.producedAt ?? ""} />
        </Field>

        <Field label="Expires at">
          <Input type="date" name="expiresAt" defaultValue={defaults?.expiresAt ?? ""} />
        </Field>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
          <Link href="/lots" className="text-sm text-ink-muted hover:text-ink">Cancel</Link>
        </div>
      </form>
    </Card>
  )
}
"use client"

import Link from "next/link"
import { useActionState } from "react"
import type { FormState } from "@/lib/types"
import { Field, Input, Select, Button, Card } from "@/components/ui"

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
    <Card className="max-w-xl p-6">
      <form action={formAction} className="grid gap-4">
        {state && !state.ok && <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <Field label="Kind" required>
          <Select name="kind" defaultValue={defaults?.kind ?? "raw_material"}>
            <option value="raw_material">Raw material</option>
            <option value="finished_good">Finished good</option>
          </Select>
        </Field>

        <Field label="SKU" required error={fieldErrors?.sku?.[0]}>
          <Input name="sku" defaultValue={defaults?.sku ?? ""} required />
        </Field>

        <Field label="Name" required error={fieldErrors?.name?.[0]}>
          <Input name="name" defaultValue={defaults?.name ?? ""} required />
        </Field>

        <Field label="Unit">
          <Input name="unit" defaultValue={defaults?.unit ?? "kg"} />
        </Field>

        <Field label="Shelf life (days)" hint="Optional">
          <Input name="shelfLifeDays" defaultValue={defaults?.shelfLifeDays ?? ""} />
        </Field>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
          <Link href="/items" className="text-sm text-ink-muted hover:text-ink">Cancel</Link>
        </div>
      </form>
    </Card>
  )
}
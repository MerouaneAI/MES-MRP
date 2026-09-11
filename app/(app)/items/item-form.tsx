"use client"

import Link from "next/link"
import { useActionState } from "react"
import type { FormState } from "@/lib/types"
import { Field, Input, Select } from "@/components/ui/field"
import { Button, buttonClass } from "@/components/ui/button"

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
    <form action={formAction} className="grid gap-4 max-w-lg">
      {state && !state.ok && <p className="text-danger text-sm">{state.error}</p>}

      <Field label="Kind">
        <Select name="kind" defaultValue={defaults?.kind ?? "raw_material"}>
          <option value="raw_material">Raw material</option>
          <option value="finished_good">Finished good</option>
          <option value="wip">WIP</option>
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

      <Field label="Shelf life (days)">
        <Input name="shelfLifeDays" defaultValue={defaults?.shelfLifeDays ?? ""} placeholder="optional" />
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
        <Link href="/items" className={buttonClass({ variant: "ghost" })}>Cancel</Link>
      </div>
    </form>
  )
}
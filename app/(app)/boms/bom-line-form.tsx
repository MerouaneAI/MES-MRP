"use client"

import { useActionState } from "react"
import { addBomLine } from "@/app/actions/boms"
import type { FormState } from "@/lib/types"
import { Field, Input, Select } from "@/components/ui/field"
import { Button } from "@/components/ui/button"

type ItemOption = { id: string; name: string; sku: string }

export function BomLineForm({ bomId, components }: { bomId: string; components: ItemOption[] }) {
  const action = addBomLine.bind(null, bomId)
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {state && !state.ok && <p className="text-danger text-sm w-full">{state.error}</p>}

      <Field label="Component">
        <Select name="componentItemId" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {components.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
        </Select>
      </Field>

      <Field label="Quantity per unit">
        <Input name="quantityPer" placeholder="0.0000" required />
      </Field>

      <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add component"}</Button>
    </form>
  )
}

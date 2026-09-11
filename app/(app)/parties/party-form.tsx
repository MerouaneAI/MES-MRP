"use client"

import Link from "next/link"
import { useActionState } from "react" // Next 14/React 18: useFormState from "react-dom"
import type { FormState } from "@/lib/types"
import { Field, Input, Select } from "@/components/ui/field"
import { Button, buttonClass } from "@/components/ui/button"

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
    <form action={formAction} className="grid gap-4 max-w-lg">
      {state && !state.ok && <p className="text-danger text-sm">{state.error}</p>}

      <Field label="Type">
        <Select name="type" defaultValue={defaults?.type ?? "supplier"}>
          <option value="customer">Customer</option>
          <option value="supplier">Supplier</option>
          <option value="both">Both</option>
        </Select>
      </Field>

      <Field label="Name" required error={fieldErrors?.name?.[0]}>
        <Input name="name" defaultValue={defaults?.name ?? ""} required />
      </Field>

      <Field label="Phone">
        <Input name="phone" defaultValue={defaults?.phone ?? ""} />
      </Field>

      <Field label="Address">
        <Input name="address" defaultValue={defaults?.address ?? ""} />
      </Field>

      <Field label="NIF" hint="optional">
        <Input name="nif" defaultValue={defaults?.nif ?? ""} />
      </Field>

      <Field label="NIS" hint="optional">
        <Input name="nis" defaultValue={defaults?.nis ?? ""} />
      </Field>

      <Field label="RC" hint="optional">
        <Input name="rc" defaultValue={defaults?.rc ?? ""} />
      </Field>

      <Field label="AI" hint="optional">
        <Input name="ai" defaultValue={defaults?.ai ?? ""} />
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
        <Link href="/parties" className={buttonClass({ variant: "ghost" })}>Cancel</Link>
      </div>
    </form>
  )
}

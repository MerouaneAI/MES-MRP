"use client"

import Link from "next/link"
import { useActionState } from "react"
import type { FormState } from "@/lib/types"
import { Field, Input, Select, Button, Card } from "@/components/ui"

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
    <Card className="max-w-xl p-6">
      <form action={formAction} className="grid gap-4">
        {state && !state.ok && <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <Field label="Type" required>
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

        <Field label="NIF" hint="Optional">
          <Input name="nif" defaultValue={defaults?.nif ?? ""} />
        </Field>

        <Field label="NIS" hint="Optional">
          <Input name="nis" defaultValue={defaults?.nis ?? ""} />
        </Field>

        <Field label="RC" hint="Optional">
          <Input name="rc" defaultValue={defaults?.rc ?? ""} />
        </Field>

        <Field label="AI" hint="Optional">
          <Input name="ai" defaultValue={defaults?.ai ?? ""} />
        </Field>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
          <Link href="/parties" className="text-sm text-ink-muted hover:text-ink">Cancel</Link>
        </div>
      </form>
    </Card>
  )
}

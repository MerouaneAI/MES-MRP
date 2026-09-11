"use client"

import { useActionState } from "react"
import { createUser } from "@/app/actions/users"
import type { FormState } from "@/lib/types"
import { Field, Input, Select } from "@/components/ui/field"
import { Button } from "@/components/ui/button"

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createUser, null)
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined
  return (
    <form action={formAction} className="grid gap-4 max-w-md mb-6">
      {state && !state.ok && <p className="text-danger text-sm">{state.error}</p>}

      <Field label="Full name" required error={fieldErrors?.name?.[0]}>
        <Input name="name" required />
      </Field>

      <Field label="Email" required error={fieldErrors?.email?.[0]}>
        <Input name="email" type="email" required />
      </Field>

      <Field label="Role">
        <Select name="role" defaultValue="operator">
          <option value="viewer">Viewer</option>
          <option value="operator">Operator</option>
          <option value="admin">Admin</option>
        </Select>
      </Field>

      <Field label="Temporary password" required error={fieldErrors?.password?.[0]} hint="min 10 chars">
        <Input name="password" type="password" required />
      </Field>

      <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create user"}</Button>
    </form>
  )
}
"use client"

import { useActionState } from "react"
import { createUser } from "@/app/actions/users"
import type { FormState } from "@/lib/types"
import { Field, Input, Select, Button, Card } from "@/components/ui"

export function CreateUserForm({ roles }: { roles: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createUser, null)
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined
  return (
    <Card className="max-w-md p-6">
      <form action={formAction} className="grid gap-4">
        {state && !state.ok && <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

        <Field label="Full name" required error={fieldErrors?.name?.[0]}>
          <Input name="name" required />
        </Field>

        <Field label="Email" required error={fieldErrors?.email?.[0]}>
          <Input name="email" type="email" required />
        </Field>

        <Field label="Role">
          <Select name="roleId" required>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Temporary password" required error={fieldErrors?.password?.[0]} hint="min 10 chars">
          <Input name="password" type="password" required />
        </Field>

        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create user"}</Button>
      </form>
    </Card>
  )
}
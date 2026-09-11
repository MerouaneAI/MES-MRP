// app/account/account-form.tsx
"use client"

import { useActionState } from "react"
import { changeMyPassword } from "@/app/actions/account"
import type { FormState } from "@/lib/types"
import { Field, Input, Button, Card } from "@/components/ui"

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(changeMyPassword, null)
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined
  return (
    <Card className="max-w-md p-6">
      <form action={formAction} className="grid gap-4">
        {state && !state.ok && <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
        {state && state.ok && <p className="rounded-control bg-success-soft px-3 py-2 text-sm text-success">Password changed.</p>}

        <Field label="Current password" required>
          <Input name="currentPassword" type="password" required />
        </Field>

        <Field label="New password" required error={fieldErrors?.newPassword?.[0]} hint="min 10 chars">
          <Input name="newPassword" type="password" required />
        </Field>

        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Change password"}</Button>
      </form>
    </Card>
  )
}
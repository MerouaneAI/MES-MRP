// app/account/account-form.tsx
"use client"

import { useActionState } from "react"
import { changeMyPassword } from "@/app/actions/account"
import type { FormState } from "@/lib/types"
import { Field, Input } from "@/components/ui/field"
import { Button } from "@/components/ui/button"

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(changeMyPassword, null)
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined
  return (
    <form action={formAction} className="grid gap-4 max-w-md">
      {state && !state.ok && <p className="text-danger text-sm">{state.error}</p>}
      {state && state.ok && <p className="text-success text-sm">Password changed.</p>}

      <Field label="Current password" required>
        <Input name="currentPassword" type="password" required />
      </Field>

      <Field label="New password" required error={fieldErrors?.newPassword?.[0]} hint="min 10 chars">
        <Input name="newPassword" type="password" required />
      </Field>

      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Change password"}</Button>
    </form>
  )
}
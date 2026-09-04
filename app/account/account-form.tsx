// app/account/account-form.tsx
"use client"

import { useActionState } from "react"
import { changeMyPassword } from "@/app/actions/account"
import type { FormState } from "@/lib/types"

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(changeMyPassword, null)
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined
  return (
    <form action={formAction} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
      {state && !state.ok && <p style={{ color: "crimson" }}>{state.error}</p>}
      {state && state.ok && <p style={{ color: "green" }}>Password changed.</p>}
      <input name="currentPassword" type="password" placeholder="Current password" required />
      <input name="newPassword" type="password" placeholder="New password (min 10 chars)" required />
      {fieldErrors?.newPassword && <span style={{ color: "crimson" }}>{fieldErrors.newPassword[0]}</span>}
      <button type="submit" disabled={pending}>{pending ? "Saving…" : "Change password"}</button>
    </form>
  )
}
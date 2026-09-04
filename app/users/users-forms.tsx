"use client"

import { useActionState } from "react"
import { createUser } from "@/app/actions/users"
import type { FormState } from "@/lib/types"

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createUser, null)
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined
  return (
    <form action={formAction} style={{ display: "grid", gap: 8, maxWidth: 420, marginBottom: 24 }}>
      {state && !state.ok && <p style={{ color: "crimson" }}>{state.error}</p>}
      <input name="name" placeholder="Full name" required />
      {fieldErrors?.name && <span style={{ color: "crimson" }}>{fieldErrors.name[0]}</span>}
      <input name="email" type="email" placeholder="Email" required />
      {fieldErrors?.email && <span style={{ color: "crimson" }}>{fieldErrors.email[0]}</span>}
      <select name="role" defaultValue="operator">
        <option value="viewer">Viewer</option>
        <option value="operator">Operator</option>
        <option value="admin">Admin</option>
      </select>
      <input name="password" type="password" placeholder="Temporary password (min 10 chars)" required />
      {fieldErrors?.password && <span style={{ color: "crimson" }}>{fieldErrors.password[0]}</span>}
      <button type="submit" disabled={pending}>{pending ? "Creating…" : "Create user"}</button>
    </form>
  )
}
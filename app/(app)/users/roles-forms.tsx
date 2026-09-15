"use client"

import { useActionState } from "react"
import { createRole } from "@/app/actions/roles"
import { Field, Input, Button, Card } from "@/components/ui"

export function CreateRoleForm() {
  const [state, formAction, pending] = useActionState(createRole, null)
  return (
    <Card className="max-w-md p-6 mb-6">
      <form action={formAction} className="flex gap-3 items-end">
        <div className="flex-1">
          <Field label="New Role Name">
            <Input name="name" required placeholder="e.g. Warehouse Clerk" />
          </Field>
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create Role"}</Button>
      </form>
      {state && !state.ok && <p className="mt-2 text-sm text-danger">{state.error}</p>}
    </Card>
  )
}

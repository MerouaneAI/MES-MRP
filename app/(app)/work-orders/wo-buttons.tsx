"use client"

import { useActionState } from "react"
import { releaseWorkOrder, completeWorkOrder } from "@/app/actions/work-orders"
import type { FormState } from "@/lib/types"

export function ReleaseButton({ workOrderId }: { workOrderId: string }) {
  const action = releaseWorkOrder.bind(null, workOrderId)
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)
  return (
    <form action={formAction}>
      {state && !state.ok && <p style={{ color: "crimson" }}>{state.error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Releasing…" : "Release (run MRP)"}</button>
    </form>
  )
}

export function CompleteButton({ workOrderId }: { workOrderId: string }) {
  const action = completeWorkOrder.bind(null, workOrderId)
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)
  return (
    <form action={formAction}>
      {state && !state.ok && <p style={{ color: "crimson" }}>{state.error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Completing…" : "Complete (consume + produce)"}</button>
    </form>
  )
}

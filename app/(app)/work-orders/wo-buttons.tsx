"use client"

import { useActionState } from "react"
import { releaseWorkOrder, completeWorkOrder } from "@/app/actions/work-orders"
import type { FormState } from "@/lib/types"
import { Button } from "@/components/ui"

export function ReleaseButton({ workOrderId }: { workOrderId: string }) {
  const action = releaseWorkOrder.bind(null, workOrderId)
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)
  return (
    <form action={formAction}>
      {state && !state.ok && <p className="text-danger text-sm">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Releasing…" : "Release (run MRP)"}</Button>
    </form>
  )
}

export function CompleteButton({ workOrderId }: { workOrderId: string }) {
  const action = completeWorkOrder.bind(null, workOrderId)
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)
  return (
    <form action={formAction}>
      {state && !state.ok && <p className="text-danger text-sm">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Completing…" : "Complete (consume + produce)"}</Button>
    </form>
  )
}

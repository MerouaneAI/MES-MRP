"use client"

import { useActionState } from "react"
import { scanBarcode } from "@/app/actions/shopfloor"
import type { ScanResult } from "@/lib/types"
import { Input, Button, Card } from "@/components/ui"

export function ScanForm() {
  const [state, formAction, pending] = useActionState<ScanResult | null, FormData>(scanBarcode, null)
  return (
    <Card className="max-w-xl p-6">
      <p className="font-serif text-lg text-ink mb-3">Barcode scan</p>
      <form action={formAction} className="flex items-end gap-2">
        <Input name="code" placeholder="Scan lot number or SKU" autoFocus required />
        <Button type="submit" disabled={pending}>{pending ? "Looking up…" : "Look up"}</Button>
      </form>
      {state && (state.ok
        ? <p className="rounded-control bg-success-soft px-3 py-2 text-sm text-success mt-3"><b>{state.title}</b> — {state.detail}</p>
        : <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger mt-3">{state.error}</p>
      )}
    </Card>
  )
}

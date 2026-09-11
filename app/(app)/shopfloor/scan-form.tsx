"use client"

import { useActionState } from "react"
import { scanBarcode } from "@/app/actions/shopfloor"
import type { ScanResult } from "@/lib/types"
import { Input, Button } from "@/components/ui"

export function ScanForm() {
  const [state, formAction, pending] = useActionState<ScanResult | null, FormData>(scanBarcode, null)
  return (
    <div className="mt-6">
      <h2>Barcode scan</h2>
      <form action={formAction} className="flex items-end gap-2">
        <Input name="code" placeholder="Scan lot number or SKU" autoFocus required />
        <Button type="submit" disabled={pending}>{pending ? "Looking up…" : "Look up"}</Button>
      </form>
      {state && (state.ok
        ? <p className="text-success mt-2"><b>{state.title}</b> — {state.detail}</p>
        : <p className="text-danger mt-2">{state.error}</p>
      )}
    </div>
  )
}

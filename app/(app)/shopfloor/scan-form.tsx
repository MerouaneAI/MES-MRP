"use client"

import { useActionState } from "react"
import { scanBarcode } from "@/app/actions/shopfloor"
import type { ScanResult } from "@/lib/types"

export function ScanForm() {
  const [state, formAction, pending] = useActionState<ScanResult | null, FormData>(scanBarcode, null)
  return (
    <div style={{ marginTop: 24 }}>
      <h2>Barcode scan</h2>
      <form action={formAction} style={{ display: "flex", gap: 8 }}>
        <input name="code" placeholder="Scan lot number or SKU" autoFocus required />
        <button type="submit" disabled={pending}>{pending ? "Looking up…" : "Look up"}</button>
      </form>
      {state && (state.ok
        ? <p style={{ color: "green", marginTop: 8 }}><b>{state.title}</b> — {state.detail}</p>
        : <p style={{ color: "crimson", marginTop: 8 }}>{state.error}</p>
      )}
    </div>
  )
}

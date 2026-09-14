"use client"

import Link from "next/link"
import { useActionState } from "react"
import type { FormState } from "@/lib/types"
import { Field, Input, Button, Card } from "@/components/ui"

type ItemOption = { id: string; name: string; sku: string }
type LotDefault = { id: string; itemId: string; lotNumber: string; quantityOnHand: string; producedAt: string | null; expiresAt: string | null }

export function BulkLotForm({
  action,
  items,
  lots,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  items: ItemOption[]
  lots: LotDefault[]
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)
  
  return (
    <Card className="max-w-3xl p-6">
      <form action={formAction} className="grid gap-8">
        {state && !state.ok && <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
        
        {lots.map((lot, idx) => {
          const item = items.find(i => i.id === lot.itemId)
          
          return (
            <div key={lot.id} className="grid gap-4 border-b border-line pb-6 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-3 text-xs font-medium text-ink-faint">{idx + 1}</span>
                <h3 className="font-medium text-ink">{item?.name} <span className="text-ink-muted">({item?.sku})</span></h3>
              </div>
              
              <input type="hidden" name="lot_id" value={lot.id} />
              <input type="hidden" name={`lot_itemId_${lot.id}`} value={lot.itemId} />
              
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Lot number" required>
                  <Input name={`lot_lotNumber_${lot.id}`} defaultValue={lot.lotNumber} required />
                </Field>
                
                <Field label="Quantity on hand" required>
                  <Input name={`lot_quantityOnHand_${lot.id}`} defaultValue={lot.quantityOnHand} required />
                </Field>
                
                <Field label="Produced at">
                  <Input type="date" name={`lot_producedAt_${lot.id}`} defaultValue={lot.producedAt ?? ""} />
                </Field>
                
                <Field label="Expires at">
                  <Input type="date" name={`lot_expiresAt_${lot.id}`} defaultValue={lot.expiresAt ?? ""} />
                </Field>
              </div>
            </div>
          )
        })}

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save all lots"}</Button>
          <Link href="/lots" className="text-sm text-ink-muted hover:text-ink">Cancel</Link>
        </div>
      </form>
    </Card>
  )
}

---
applyTo: "{db/schema/inventory.ts,app/actions/**/lot*.ts,app/actions/**/production*.ts}"
---
# Lot traceability rules
- Quantity lives on lots.quantity_on_hand, never on items.
- Every stock movement references a specific lot id.
- Producing a finished lot MUST insert lot_genealogy rows linking each consumed
  input lot to the output lot (with quantity used).
- Consumption picks lots FEFO: ORDER BY expires_at ASC, NULLS handled explicitly.
- Expiry check job flags lots where quantity_on_hand > 0 AND expires_at <= now+N days.
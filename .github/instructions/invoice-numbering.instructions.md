---
applyTo: "app/actions/**/invoice*.ts"
---
# Invoice numbering — DO NOT SIMPLIFY
- Numbers must be gapless per (facilityId, fiscalYear).
- Use ONE counter row per (facility, year) in invoice_counters.
- Increment with `UPDATE invoice_counters SET last_number = last_number + 1
  WHERE ... RETURNING last_number` inside the SAME transaction as the insert.
- This row lock is what prevents duplicate/gap numbers under concurrency.
- Never generate numbers with count(*), max()+1, or app-side counters.
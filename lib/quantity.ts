// pg returns numeric columns as STRINGS. Do ALL quantity math in integer units
// via BigInt, never parseFloat. Default 3 dp (numeric(14,3)); BOM quantityPer is 4 dp.
import { toCents, fromCents } from "./money"

// requirement = quantityPer (per unit, 4 dp) * quantityPlanned (units, 3 dp), rounded to 3 dp.
export function requirementFor(quantityPer: string, quantityPlanned: string): string {
  const per = toCents(quantityPer, 4)      // scaled 1e4
  const qty = toCents(quantityPlanned, 3)  // scaled 1e3
  const product = per * qty                // scaled 1e7
  const scale = 10000n                     // divide back to 1e3
  const rounded = (product + scale / 2n) / scale
  return fromCents(rounded, 3)
}

export function addQty(...values: string[]): string {
  const sum = values.reduce((acc, v) => acc + toCents(v, 3), 0n)
  return fromCents(sum, 3)
}

export function subtractQty(a: string, b: string): string {
  return fromCents(toCents(a, 3) - toCents(b, 3), 3)
}

// -1 if a<b, 0 if equal, 1 if a>b
export function compareQty(a: string, b: string): number {
  const x = toCents(a, 3)
  const y = toCents(b, 3)
  return x < y ? -1 : x > y ? 1 : 0
}

export function minQty(a: string, b: string): string {
  return compareQty(a, b) <= 0 ? a : b
}

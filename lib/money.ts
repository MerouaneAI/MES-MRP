// pg returns numeric columns as STRINGS. Keep money/quantities as strings and do
// all arithmetic in integer "cents" (BigInt) so we never lose precision to floats.

export function toCents(value: string | number, decimals = 2): bigint {
  const s = typeof value === "number" ? value.toString() : value.trim()
  const neg = s.startsWith("-")
  const [intPart, fracPart = ""] = (neg ? s.slice(1) : s).split(".")
  const frac = (fracPart + "0".repeat(decimals)).slice(0, decimals)
  const digits = `${intPart}${frac}`.replace(/^0+(?=\d)/, "")
  const n = BigInt(digits || "0")
  return neg ? -n : n
}

export function fromCents(cents: bigint, decimals = 2): string {
  const neg = cents < 0n
  const abs = (neg ? -cents : cents).toString().padStart(decimals + 1, "0")
  const intPart = abs.slice(0, abs.length - decimals)
  const frac = abs.slice(abs.length - decimals)
  return `${neg ? "-" : ""}${intPart}.${frac}`
}

// lineTotal = quantity (3 dp) * unitPrice (2 dp), returned as a 2 dp money string.
export function multiplyMoney(quantity: string, unitPrice: string): string {
  const q = toCents(quantity, 3)   // scaled by 1e3
  const p = toCents(unitPrice, 2)  // scaled by 1e2
  const product = q * p            // scaled by 1e5
  const scaled = 1000n             // divide back to 1e2 (money), with rounding
  const rounded = (product + scaled / 2n) / scaled
  return fromCents(rounded, 2)
}

export function addMoney(...values: string[]): string {
  const sum = values.reduce((acc, v) => acc + toCents(v, 2), 0n)
  return fromCents(sum, 2)
}
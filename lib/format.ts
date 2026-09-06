// lib/format.ts
export function formatCount(n: number | string) {
  return new Intl.NumberFormat("en-US").format(Number(n))
}
export function formatCompact(n: number | string) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(Number(n))
}
export function formatDA(n: number | string) {
  return `${formatCompact(n)} DA`            // DZD-only per your locked decisions
}
export function formatPct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`
}
export function formatShortDate(d: Date | string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
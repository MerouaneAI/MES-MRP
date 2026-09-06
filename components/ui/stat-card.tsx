// components/ui/stat-card.tsx
import { cn } from "@/lib/cn"
import { type LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react"

export function StatCard({
  label, value, delta, deltaTone = "up", note, icon: Icon,
}: {
  label: string
  value: React.ReactNode          // preformatted string, e.g. "$2.84M", "96.8%"
  delta?: string                  // e.g. "+4.3%"
  deltaTone?: "up" | "down"
  note?: string                   // e.g. "vs last week"
  icon: LucideIcon
}) {
  const positive = deltaTone === "up"
  return (
    <div className="card group relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <span className="label">{label}</span>
        <span className="grid h-10 w-10 place-items-center rounded-tile bg-gold-soft text-gold">
          <Icon size={18} strokeWidth={1.75} />
        </span>
      </div>
      <div className="mt-3 font-serif text-4xl tabular-nums text-ink">{value}</div>
      {(delta || note) && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          {delta && (
            <span className={cn("inline-flex items-center gap-0.5 font-medium",
              positive ? "text-success" : "text-danger")}>
              {positive ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
              {delta}
            </span>
          )}
          {note && <span className="text-ink-faint">{note}</span>}
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 -bottom-16 h-24 bg-gold-soft opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  )
}
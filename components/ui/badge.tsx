// components/ui/badge.tsx
import { cn } from "@/lib/cn"

type Tone = "gold" | "green" | "red" | "gray" | "blue"

const tones: Record<Tone, string> = {
  gold:  "bg-gold-soft text-gold border border-[rgba(201,169,97,0.30)]",
  green: "bg-success-soft text-success border border-[rgba(95,208,138,0.30)]",
  red:   "bg-danger-soft text-danger border border-[rgba(240,113,106,0.30)]",
  blue:  "bg-info-soft text-info border border-[rgba(107,168,230,0.30)]",
  gray:  "bg-surface-2 text-ink-muted border border-line-strong",
}

export function Badge({ tone = "gray", children, className }: {
  tone?: Tone; children: React.ReactNode; className?: string
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
      tones[tone], className,
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

// Domain status/type -> tone. Unknown values fall back to gray.
const STATUS_TONE: Record<string, Tone> = {
  // work orders
  planned: "gray", released: "gold", "in progress": "gold", in_progress: "gold",
  completed: "green", cancelled: "gray", closed: "gray",
  // purchase orders
  draft: "gray", ordered: "gold", received: "green",
  // bom / eco
  active: "green", archived: "gray", applied: "green",
  // inventory movement types
  receipt: "green", issue: "red",
}
export function statusTone(status: string): Tone {
  return STATUS_TONE[(status ?? "").toLowerCase()] ?? "gray"
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status.replace(/_/g, " ")}</Badge>
}
// components/ui/empty-state.tsx
import { type LucideIcon } from "lucide-react"
export function EmptyState({
  icon: Icon, title, description, action,
}: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="card grid place-items-center gap-3 px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-tile bg-surface-2 text-ink-faint">
        <Icon size={22} strokeWidth={1.5} />
      </span>
      <div>
        <p className="font-serif text-lg text-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
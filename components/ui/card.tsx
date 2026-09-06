// components/ui/card.tsx
import { cn } from "@/lib/cn"

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />
}

export function Panel({
  title, subtitle, action, children, className,
}: {
  title: string; subtitle?: string; action?: React.ReactNode
  children: React.ReactNode; className?: string
}) {
  return (
    <section className={cn("card p-5", className)}>
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

// The pulsing “Live” pill from the Production Output panel.
export function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      Live
    </span>
  )
}
// components/ui/button.tsx
import { cn } from "@/lib/cn"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md"

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-medium " +
  "transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,169,97,0.4)]"

const variants: Record<Variant, string> = {
  primary: "bg-gold text-bg hover:bg-gold-strong shadow-[0_6px_20px_rgba(201,169,97,0.18)]",
  secondary: "bg-surface-2 text-ink border border-line-strong hover:border-[rgba(201,169,97,0.5)]",
  ghost: "text-ink-muted hover:text-ink hover:bg-surface-2",
  danger: "bg-danger-soft text-danger border border-[rgba(240,113,106,0.3)] hover:bg-[rgba(240,113,106,0.2)]",
}
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
}

// Shared class builder so a Next <Link> can look like a button too.
export function buttonClass(opts: { variant?: Variant; size?: Size; className?: string } = {}) {
  const { variant = "primary", size = "md", className } = opts
  return cn(base, variants[variant], sizes[size], className)
}

export function Button({
  variant = "primary", size = "md", className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass({ variant, size, className })} {...props} />
}
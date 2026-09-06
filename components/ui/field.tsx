// components/ui/field.tsx
import { cn } from "@/lib/cn"

export function Field({
  label, error, hint, required, children,
}: {
  label: string; error?: string; hint?: string; required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-ink-muted">
        {label}{required && <span className="text-gold"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="text-xs text-ink-faint">{hint}</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  )
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...props} />
}
export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("input appearance-none pr-8", className)} {...props} />
}
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input min-h-[90px] resize-y", className)} {...props} />
}
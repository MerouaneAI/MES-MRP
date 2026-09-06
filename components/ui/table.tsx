// components/ui/table.tsx
import { cn } from "@/lib/cn"

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)}>{children}</table>
    </div>
  )
}
export function THead({ children }: { children: React.ReactNode }) {
  return <thead><tr className="border-b border-line text-left">{children}</tr></thead>
}
export function TH({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("label py-2.5 pr-4", className)}>{children}</th>
}
export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>
}
export function TR({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("border-b border-line transition-colors hover:bg-surface-2", className)}>{children}</tr>
}
export function TD({ children, className, align }: {
  children?: React.ReactNode; className?: string; align?: "left" | "right" | "center"
}) {
  return (
    <td className={cn("py-3 pr-4 text-ink",
      align === "right" && "text-right tabular-nums",
      align === "center" && "text-center", className)}>
      {children}
    </td>
  )
}
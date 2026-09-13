"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition } from "react"

interface Option {
  label: string
  value: string
}

export function SelectFilter({ paramName, options, placeholder = "Filter..." }: { paramName: string, options: Option[], placeholder?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const currentValue = searchParams.get(paramName) ?? ""

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set(paramName, val)
    } else {
      params.delete(paramName)
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="relative flex items-center">
      <select
        value={currentValue}
        onChange={handleChange}
        className="h-9 rounded-control border border-line bg-surface-2 px-3 text-sm text-ink outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold appearance-none pr-8 cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-faint">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      {isPending && (
        <span className="absolute -right-5 h-3 w-3 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      )}
    </div>
  )
}

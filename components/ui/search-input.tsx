"use client"

import { Search } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"

export function SearchInput({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [query, setQuery] = useState(searchParams.get("q") ?? "")

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get("q") ?? ""
      if (query !== currentQ) {
        const params = new URLSearchParams(searchParams.toString())
        if (query) {
          params.set("q", query)
        } else {
          params.delete("q")
        }
        startTransition(() => {
          router.replace(`${pathname}?${params.toString()}`)
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, pathname, router, searchParams])

  return (
    <div className="relative flex items-center">
      <Search size={15} className="absolute left-3 text-ink-faint" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-9 w-[200px] md:w-64 rounded-control border border-line bg-surface-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
      />
      {isPending && (
        <span className="absolute right-3 h-3 w-3 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      )}
    </div>
  )
}

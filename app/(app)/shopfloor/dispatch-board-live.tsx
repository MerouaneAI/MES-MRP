"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function DispatchBoardLive() {
  const router = useRouter()
  useEffect(() => {
    const es = new EventSource("/api/shopfloor/stream")
    es.addEventListener("shopfloor", () => {
      router.refresh() // a WO changed -> re-fetch the server board
    })
    es.onerror = () => { /* browser auto-reconnects via the retry hint */ }
    return () => es.close()
  }, [router])

  return <p className="text-success text-xs m-0">● Live — updates automatically</p>
}

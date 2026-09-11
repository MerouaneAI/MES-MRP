// app/error.tsx
"use client"

import { AlertTriangle } from "lucide-react"
import { Button, Card } from "@/components/ui"

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger-soft text-danger">
          <AlertTriangle size={24} />
        </div>
        <h1 className="font-serif text-2xl text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-muted">An unexpected error occurred. Your data was not changed.</p>
        <Button className="mt-6" onClick={() => reset()}>Try again</Button>
      </Card>
    </main>
  )
}
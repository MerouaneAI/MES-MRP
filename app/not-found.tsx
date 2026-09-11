// app/not-found.tsx
import Link from "next/link"
import { SearchX } from "lucide-react"
import { Card, buttonClass } from "@/components/ui"

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-gold-soft text-gold">
          <SearchX size={24} />
        </div>
        <h1 className="font-serif text-2xl text-ink">Not found</h1>
        <p className="mt-2 text-sm text-ink-muted">The page you're looking for doesn't exist.</p>
        <Link href="/" className={`${buttonClass({ variant: "secondary" })} mt-6 inline-block`}>Go home</Link>
      </Card>
    </main>
  )
}
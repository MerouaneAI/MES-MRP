// app/not-found.tsx
import Link from "next/link"

export default function NotFound() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Not found</h1>
      <Link href="/">Go home</Link>
    </main>
  )
}
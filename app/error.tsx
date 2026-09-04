// app/error.tsx
"use client"

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Something went wrong</h1>
      <p>An unexpected error occurred. Your data was not changed.</p>
      <button onClick={() => reset()}>Try again</button>
    </main>
  )
}
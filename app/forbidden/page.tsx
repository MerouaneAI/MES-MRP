import Link from "next/link"
import { Nav } from "@/components/nav"

export default function ForbiddenPage() {
  return (
    <main style={{ padding: 24 }}>
      <Nav />
      <h1>Access denied</h1>
      <p>You don't have permission to view this page. Ask an administrator if you need access.</p>
      <Link href="/">Back to app</Link>
    </main>
  )
}
import Link from "next/link"

export default function ForbiddenPage() {
  return (
    <div className="space-y-6">
      <h1>Access denied</h1>
      <p>You don't have permission to view this page. Ask an administrator if you need access.</p>
      <Link href="/">Back to app</Link>
    </div>
  )
}
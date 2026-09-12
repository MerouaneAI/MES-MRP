import Link from "next/link"
import { PageHeader, buttonClass } from "@/components/ui"

export default function ForbiddenPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Access denied" />
      <p>You don&apos;t have permission to view this page. Ask an administrator if you need access.</p>
      <Link href="/" className={buttonClass({ variant: "secondary" })}>Back to app</Link>
    </div>
  )
}
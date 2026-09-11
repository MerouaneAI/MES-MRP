import { Crown } from "lucide-react"
import { signIn } from "@/auth"
import { Field, Input, Button, Card } from "@/components/ui"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-tile bg-gold-soft text-gold"><Crown size={20} /></span>
          <div><p className="font-serif text-xl text-ink">AurumMES</p><p className="label">Enterprise Suite</p></div>
        </div>

        {error && (
          <p className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger mb-4">
            {error === "CredentialsSignin" ? "Invalid email or password." : decodeURIComponent(error)}
          </p>
        )}

        <form
          action={async (formData) => {
            "use server"
            await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirectTo: "/dashboard",
            })
          }}
          className="grid gap-4"
        >
          <Field label="Email" required><Input name="email" type="email" required /></Field>
          <Field label="Password" required><Input name="password" type="password" required /></Field>
          <Button type="submit">Sign in</Button>
        </form>
      </Card>
    </main>
  )
}
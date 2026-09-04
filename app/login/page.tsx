import { signIn } from "@/auth"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams
    return (
        <main style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
            <form
                action={async (formData) => {
                    "use server"
                    await signIn("credentials", {
                        email: formData.get("email"),
                        password: formData.get("password"),
                        redirectTo: "/",
                    })
                }}
                style={{ display: "grid", gap: 10, width: 320 }}
            >
                <h1 style={{ textAlign: "center" }}>Sign in</h1>
                {error && (
                    <p style={{ color: "crimson", margin: 0, fontSize: 14 }}>
                        {error === "CredentialsSignin" ? "Invalid email or password." : decodeURIComponent(error)}
                    </p>
                )}
                <input name="email" type="email" placeholder="Email" required />
                <input name="password" type="password" placeholder="Password" required />
                <button type="submit">Sign in</button>
            </form>
        </main>
    )
}
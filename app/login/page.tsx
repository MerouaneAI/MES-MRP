import { signIn } from "@/auth"

export default function LoginPage() {
    return (
        <form
            action={async (formData) => {
                "use server"
                await signIn("credentials", {
                    email: formData.get("email"),
                    password: formData.get("password"),
                    redirectTo: "/",
                })
            }}
        >
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit">Sign in</button>
        </form>
    )
}
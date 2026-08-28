---
applyTo: "{auth.ts,middleware.ts,app/login/**,app/api/auth/**}"
---
# Auth rules (NextAuth v5)
- Credentials provider only. Passwords verified with bcrypt.compare.
- Session strategy = "jwt". Put user role into the token and expose on session.
- Protected pages/actions call `auth()` and check session + role.
- Never store plaintext passwords. Never add OAuth providers without approval.
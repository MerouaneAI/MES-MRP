# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest `main` | ✅ |

## Reporting a Vulnerability

**Do NOT open a public issue for security vulnerabilities.**

Instead, email **security@factory.local** (or open a private security advisory on GitHub) with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will acknowledge your report within 48 hours and provide a timeline for a fix.

## Security Practices

- Passwords are hashed with **bcrypt** (10 rounds)
- Sessions use **JWT** with configurable expiry (default: 12 hours)
- Login attempts are **rate-limited** via Redis (5 per 15 minutes per email)
- All mutations use **Zod** input validation
- Server Actions provide built-in **CSRF protection**
- Role-based access control is enforced **server-side** on every action
- Every mutation is recorded in the **audit log**

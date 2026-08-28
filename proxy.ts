import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/auth"

export async function proxy(request: NextRequest) {
  const session = await auth()

  const isLoginPage = request.nextUrl.pathname === "/login"
  const isAuthApi = request.nextUrl.pathname.startsWith("/api/auth")

  // Allow auth API routes to pass through
  if (isAuthApi) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login
  if (!session) {
    if (isLoginPage) return NextResponse.next()
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect authenticated users away from login page
  if (isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
}

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/login", "/reset-password"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get("accessToken")?.value

  const isDashboardRoute = pathname.startsWith("/dashboard")
  const isAccountRoute = pathname.startsWith("/account")
  const isBannersRoute = pathname.startsWith("/banners")
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  if ((isDashboardRoute || isAccountRoute || isBannersRoute) && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isPublicRoute && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/account", "/banners", "/login", "/reset-password"],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Route guard for authenticated surfaces.
 *
 * We only check for the presence of the httpOnly cookie — we do NOT verify
 * the JWT here. The backend still does real verification on every request.
 * A malicious client sending a cookie value of "anything" gets past this
 * middleware but gets 401 from the backend; that's fine. The middleware
 * exists to save the round-trip for obviously-logged-out users and to give
 * better UX (redirect to /login before the dashboard even loads).
 *
 * NOTE: Users who logged in BEFORE the cookie rollout only have the old
 * localStorage token. The dashboard layout's client-side `isUserAuthenticated()`
 * check still catches them — they'll see the loading state and get bounced
 * to /login.  Once they log in again they get both cookie + localStorage.
 */

const PORTFOLIO_COOKIE = 'portfolio_user_token'
const ADMIN_COOKIE = 'admin_token'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Portfolio user dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!req.cookies.get(PORTFOLIO_COOKIE)?.value) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Admin surface — /admin/login is the only exception
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!req.cookies.get(ADMIN_COOKIE)?.value) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Only run middleware on these trees — never on /api or static assets.
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}

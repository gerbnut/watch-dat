export const runtime = 'nodejs'
import { auth } from './auth'
import { NextResponse } from 'next/server'

const protectedRoutes = ['/diary', '/lists', '/settings', '/watchlist', '/pick-username']
const authRoutes = ['/login', '/register', '/verify']

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

function applySecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value)
  }
  return response
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && authRoutes.some((r) => pathname.startsWith(r))) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/', req.url)))
  }

  // Redirect unauthenticated users away from protected routes
  if (!isLoggedIn && protectedRoutes.some((r) => pathname.startsWith(r))) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return applySecurityHeaders(NextResponse.redirect(loginUrl))
  }

  // Force Google users without a username to /pick-username
  if (
    isLoggedIn &&
    req.auth?.user?.needsUsername === true &&
    pathname !== '/pick-username' &&
    !pathname.startsWith('/api')
  ) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/pick-username', req.url)))
  }

  return applySecurityHeaders(NextResponse.next())
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

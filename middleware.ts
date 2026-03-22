export const runtime = 'nodejs'
import { auth } from './auth'
import { NextResponse } from 'next/server'

const protectedRoutes = ['/diary', '/lists', '/settings', '/watchlist', '/pick-username']
const authRoutes = ['/login', '/register', '/verify']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && authRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Redirect unauthenticated users away from protected routes
  if (!isLoggedIn && protectedRoutes.some((r) => pathname.startsWith(r))) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Force OAuth users without a username to /pick-username
  if (
    isLoggedIn &&
    req.auth?.user?.needsUsername === true &&
    pathname !== '/pick-username' &&
    !pathname.startsWith('/api')
  ) {
    return NextResponse.redirect(new URL('/pick-username', req.url))
  }

  // Force users who haven't completed onboarding to /onboarding
  if (
    isLoggedIn &&
    req.auth?.user?.needsUsername !== true &&
    !req.auth?.user?.onboardedAt &&
    pathname !== '/onboarding' &&
    !pathname.startsWith('/api')
  ) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - static assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)',
  ],
}

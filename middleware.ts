export const runtime = 'nodejs'
import { auth } from './auth'
import { NextResponse } from 'next/server'

const protectedRoutes = ['/diary', '/lists', '/settings', '/watchlist']
const authRoutes = ['/login', '/register']

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

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

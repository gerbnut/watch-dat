import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashOTP } from '@/lib/otp'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { signIn } from '@/auth'

// Rate limit: 5 attempts per email per 10 minutes
const rateLimits = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { email, code } = body

  if (!email || !code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Email and code required' }, { status: 400 })
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Rate limit
  const now = Date.now()
  const limit = rateLimits.get(normalizedEmail)
  if (limit && now < limit.resetAt) {
    if (limit.count >= 5) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
    }
    limit.count++
  } else {
    rateLimits.set(normalizedEmail, { count: 1, resetAt: now + 10 * 60 * 1000 })
  }

  const hashedCode = hashOTP(code)

  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: normalizedEmail,
      token: hashedCode,
    },
  })

  if (!token || token.expires < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
  }

  // Delete used token
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: normalizedEmail,
        token: hashedCode,
      },
    },
  })

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (user) {
    // Existing user — sign them in server-side
    try {
      await signIn('otp', {
        identifier: normalizedEmail,
        redirect: false,
      })
    } catch (err: any) {
      // next-auth signIn throws a NEXT_REDIRECT on success when called server-side
      if (err?.digest?.startsWith('NEXT_REDIRECT')) {
        return NextResponse.json({ success: true, isNewUser: false })
      }
      throw err
    }
    return NextResponse.json({ success: true, isNewUser: false })
  }

  // New user — issue registration token
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
  const registrationToken = await new SignJWT({ email: normalizedEmail, verified: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('5m')
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set('registration_token', registrationToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 60,
    path: '/',
  })

  return NextResponse.json({ success: true, isNewUser: true })
}

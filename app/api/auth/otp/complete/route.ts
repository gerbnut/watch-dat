import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { signIn } from '@/auth'
import { validateUsernameFormat, validateDisplayName } from '@/lib/form-validation'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get('registration_token')

  if (!tokenCookie?.value) {
    return NextResponse.json({ error: 'No registration token. Please verify your email first.' }, { status: 401 })
  }

  // Verify JWT
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
  let payload: { email: string; verified: boolean }
  try {
    const result = await jwtVerify(tokenCookie.value, secret)
    payload = result.payload as any
    if (!payload.email || !payload.verified) throw new Error()
  } catch {
    cookieStore.delete('registration_token')
    return NextResponse.json({ error: 'Registration token expired. Please verify your email again.' }, { status: 401 })
  }

  const { username, displayName } = await req.json()

  // Validate
  const usernameErr = validateUsernameFormat(username)
  if (usernameErr) {
    return NextResponse.json({ error: usernameErr }, { status: 400 })
  }

  const displayNameErr = validateDisplayName(displayName)
  if (displayNameErr) {
    return NextResponse.json({ error: displayNameErr }, { status: 400 })
  }

  // Check username availability
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: 'Username taken' }, { status: 409 })
  }

  // Check email not already registered
  const existingEmail = await prisma.user.findUnique({ where: { email: payload.email } })
  if (existingEmail) {
    cookieStore.delete('registration_token')
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  // Create user (no password — passwordless)
  await prisma.user.create({
    data: {
      email: payload.email,
      username,
      displayName: displayName.trim(),
    },
  })

  // Clear registration token
  cookieStore.delete('registration_token')

  // Sign in
  try {
    await signIn('otp', {
      identifier: payload.email,
      redirect: false,
    })
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT')) {
      return NextResponse.json({ success: true, redirect: '/onboarding' })
    }
    throw err
  }

  return NextResponse.json({ success: true, redirect: '/onboarding' })
}

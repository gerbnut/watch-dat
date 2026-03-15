import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateOTP, hashOTP, sendEmailOTP } from '@/lib/otp'

// In-memory rate limit: email -> { count, resetAt }
const rateLimits = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Rate limit: 3 sends per email per 10 minutes
  const now = Date.now()
  const limit = rateLimits.get(normalizedEmail)
  if (limit && now < limit.resetAt) {
    if (limit.count >= 3) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }
    limit.count++
  } else {
    rateLimits.set(normalizedEmail, { count: 1, resetAt: now + 10 * 60 * 1000 })
  }

  const code = generateOTP()
  const hashedCode = hashOTP(code)

  // Delete existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: normalizedEmail },
  })

  // Create new token with 10-min expiry
  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token: hashedCode,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  try {
    await sendEmailOTP(normalizedEmail, code)
  } catch {
    return NextResponse.json({ error: 'Failed to send email. Try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

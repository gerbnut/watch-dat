import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rateLimit'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: Request) {
  const { email: rawEmail } = await req.json()
  const email = (rawEmail || '').toLowerCase().trim()

  if (!email) {
    return NextResponse.json({ success: true })
  }

  const { allowed } = rateLimit({ key: `forgot:${email}`, limit: 3, windowSec: 3600 })
  if (!allowed) {
    return NextResponse.json({ success: true })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (user && user.password !== null) {
    // Delete previous unused tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, used: false },
    })

    const rawToken = crypto.randomUUID()
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })

    const baseUrl = process.env.AUTH_URL || 'https://watchdat.xyz'
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`

    await sendPasswordResetEmail(email, resetUrl)
  }

  // Always return success to prevent email enumeration
  return NextResponse.json({ success: true })
}

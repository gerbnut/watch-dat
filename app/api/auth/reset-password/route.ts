import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: Request) {
  const { token, newPassword } = await req.json()

  if (!token || !newPassword) {
    return NextResponse.json(
      { error: 'This reset link is invalid or has expired' },
      { status: 400 }
    )
  }

  const { allowed } = rateLimit({ key: `reset:${token}`, limit: 5, windowSec: 900 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    )
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
  })

  if (!resetToken || resetToken.expiresAt < new Date() || resetToken.used) {
    return NextResponse.json(
      { error: 'This reset link is invalid or has expired' },
      { status: 400 }
    )
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  })

  // Mark token as used and delete all other tokens for this user
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { used: true },
  })

  await prisma.passwordResetToken.deleteMany({
    where: { userId: resetToken.userId, id: { not: resetToken.id } },
  })

  return NextResponse.json({ success: true })
}

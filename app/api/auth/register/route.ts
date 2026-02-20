export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string().min(1, 'Display name required').max(50),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, username, displayName, password } = parsed.data

    // Check uniqueness
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
      prisma.user.findUnique({ where: { username: username.toLowerCase() } }),
    ])

    if (existingEmail) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        displayName,
        password: hashedPassword,
      },
      select: { id: true, email: true, username: true, displayName: true },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

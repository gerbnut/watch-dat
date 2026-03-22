import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

const VALID_TYPES = [
  'NEW_FOLLOWER',
  'LIKED_REVIEW',
  'COMMENTED_REVIEW',
  'REPLIED_COMMENT',
  'MENTION',
  'RECOMMENDED_MOVIE',
] as const

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPrefs: true },
  })

  const prefs = (user?.notificationPrefs as Record<string, boolean>) ?? {}
  return NextResponse.json({ prefs })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const prefs: Record<string, boolean> = {}

  for (const type of VALID_TYPES) {
    if (typeof body[type] === 'boolean') {
      prefs[type] = body[type]
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationPrefs: prefs },
  })

  return NextResponse.json({ prefs })
}

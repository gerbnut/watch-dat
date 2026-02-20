export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const target = await prisma.user.findUnique({
      where: { username: params.username.toLowerCase() },
      select: { id: true },
    })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (target.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: target.id,
        },
      },
    })

    if (existing) {
      // Unfollow
      await prisma.follow.delete({ where: { id: existing.id } })
      return NextResponse.json({ following: false })
    } else {
      // Follow
      await prisma.follow.create({
        data: { followerId: session.user.id, followingId: target.id },
      })

      // Activity + notification
      await Promise.all([
        prisma.activity.create({
          data: {
            userId: session.user.id,
            type: 'FOLLOWED_USER',
            metadata: { targetUserId: target.id, targetUsername: params.username },
          },
        }),
        prisma.notification.create({
          data: {
            userId: target.id,
            actorId: session.user.id,
            type: 'NEW_FOLLOWER',
          },
        }),
      ])

      return NextResponse.json({ following: true })
    }
  } catch (err) {
    console.error('Follow error:', err)
    return NextResponse.json({ error: 'Failed to toggle follow' }, { status: 500 })
  }
}

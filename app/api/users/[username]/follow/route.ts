export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
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

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: target.id,
          },
        },
      })

      if (existing) {
        await tx.follow.delete({ where: { id: existing.id } })
        return { following: false }
      } else {
        await tx.follow.create({
          data: { followerId: session.user.id, followingId: target.id },
        })
        return { following: true }
      }
    })

    if (result.following) {
      // Activity + notification outside transaction (non-critical side effects)
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
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Follow error:', err)
    return NextResponse.json({ error: 'Failed to toggle follow' }, { status: 500 })
  }
}

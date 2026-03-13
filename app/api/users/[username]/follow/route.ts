export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { sendPushToUser } from '@/lib/webpush'

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const target = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
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
      // Guard: only log activity + notification if none already exists for this pair.
      // Prevents duplicates when a user follows → unfollows → follows again.
      const alreadyLogged = await prisma.activity.findFirst({
        where: {
          userId: session.user.id,
          type: 'FOLLOWED_USER',
          metadata: { path: ['targetUserId'], equals: target.id },
        },
        select: { id: true },
      })

      if (!alreadyLogged) {
        const actor = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { displayName: true, username: true },
        })
        // Activity + notification are critical — await them
        await Promise.all([
          prisma.activity.create({
            data: {
              userId: session.user.id,
              type: 'FOLLOWED_USER',
              metadata: { targetUserId: target.id, targetUsername: username },
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

        // Push is fire-and-forget — never let it break the follow action
        sendPushToUser(target.id, {
          title: 'New follower',
          body: `${actor?.displayName ?? 'Someone'} started following you`,
          url: `/user/${actor?.username ?? session.user.id}`,
        }).catch(() => {})
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Follow error:', err)
    return NextResponse.json({ error: 'Failed to toggle follow' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { rateLimit, getIp } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  const { allowed, headers } = rateLimit({
    key: `ip:${getIp(req)}:user-search`,
    limit: 30,
    windowSec: 60,
  })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers })
  }

  const { searchParams } = req.nextUrl
  const query = searchParams.get('q') ?? ''

  const trimmedQuery = query.trim()
  if (trimmedQuery.length < 1 || trimmedQuery.length > 50) {
    return NextResponse.json([])
  }

  try {
    const session = await auth()

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: trimmedQuery, mode: 'insensitive' } },
          { displayName: { contains: trimmedQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        _count: { select: { reviews: true, followers: true } },
      },
      take: 10,
    })

    if (!session?.user?.id || users.length === 0) {
      return NextResponse.json(users.map((u) => ({ ...u, isFollowing: false })))
    }

    const follows = await prisma.follow.findMany({
      where: { followerId: session.user.id, followingId: { in: users.map((u) => u.id) } },
      select: { followingId: true },
    })
    const followingIds = new Set(follows.map((f) => f.followingId))

    return NextResponse.json(
      users.map((u) => ({ ...u, isFollowing: followingIds.has(u.id) }))
    )
  } catch (err) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

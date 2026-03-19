export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

// POST — toggle block
export async function POST(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const target = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (target.id === session.user.id) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })

    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: target.id } },
    })

    if (existing) {
      await prisma.block.delete({ where: { id: existing.id } })
      revalidatePath(`/user/${encodeURIComponent(username)}`)
      return NextResponse.json({ blocked: false })
    }

    await prisma.$transaction([
      prisma.block.create({ data: { blockerId: session.user.id, blockedId: target.id } }),
      // Also unfollow each other
      prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: session.user.id, followingId: target.id },
            { followerId: target.id, followingId: session.user.id },
          ],
        },
      }),
    ])

    revalidatePath(`/user/${encodeURIComponent(username)}`)
    return NextResponse.json({ blocked: true })
  } catch (err) {
    console.error('Block error:', err)
    return NextResponse.json({ error: 'Failed to update block status' }, { status: 500 })
  }
}

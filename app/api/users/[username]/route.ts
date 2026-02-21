export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { z } from 'zod'

const patchSchema = z.object({
  displayName: z.string().trim().min(1).max(50).optional(),
  bio: z.string().trim().max(300).optional().nullable(),
  avatar: z.string().max(2 * 1024 * 1024).optional().nullable(),
  bannerUrl: z.string().max(4 * 1024 * 1024).optional().nullable(),
})

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const session = await auth()

    const user = await prisma.user.findUnique({
      where: { username: params.username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bannerUrl: true,
        bio: true,
        joinDate: true,
        _count: {
          select: {
            reviews: true,
            following: true,
            followers: true,
            lists: { where: { isPublic: true } },
          },
        },
        favoriteMovies: {
          include: {
            movie: { select: { id: true, tmdbId: true, title: true, poster: true } },
          },
          orderBy: { order: 'asc' },
          take: 5,
        },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let isFollowing = false
    if (session?.user?.id && session.user.id !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: user.id,
          },
        },
      })
      isFollowing = !!follow
    }

    return NextResponse.json({ ...user, isFollowing })
  } catch (err) {
    console.error('User profile error:', err)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { username: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username.toLowerCase() },
      select: { id: true },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (user.id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { displayName, bio, avatar, bannerUrl } = parsed.data

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(displayName ? { displayName } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(avatar !== undefined ? { avatar } : {}),
        ...(bannerUrl !== undefined ? { bannerUrl } : {}),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bannerUrl: true,
        bio: true,
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Update profile error:', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

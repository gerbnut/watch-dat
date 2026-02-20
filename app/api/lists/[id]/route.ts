export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { z } from 'zod'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const list = await prisma.list.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        items: {
          include: {
            movie: {
              select: {
                id: true,
                tmdbId: true,
                title: true,
                poster: true,
                releaseDate: true,
                genres: true,
                directors: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { items: true } },
      },
    })

    if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Private list — only owner can view
    if (!list.isPublic && list.user.id !== session?.user?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(list)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load list' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const list = await prisma.list.findUnique({ where: { id: params.id } })
    if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (list.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const updated = await prisma.list.update({
      where: { id: params.id },
      data: {
        name: body.name ?? undefined,
        description: body.description ?? undefined,
        isPublic: body.isPublic ?? undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const list = await prisma.list.findUnique({ where: { id: params.id } })
    if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (list.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.list.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 })
  }
}

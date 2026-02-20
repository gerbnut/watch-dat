export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { getOrCacheMovie } from '@/lib/tmdb'
import { z } from 'zod'

const addItemSchema = z.object({
  tmdbId: z.number().int().positive(),
  note: z.string().max(1000).optional(),
})

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), order: z.number() })),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
    const parsed = addItemSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const movie = await getOrCacheMovie(parsed.data.tmdbId)

    // Get current max order
    const lastItem = await prisma.listItem.findFirst({
      where: { listId: params.id },
      orderBy: { order: 'desc' },
    })

    const item = await prisma.listItem.create({
      data: {
        listId: params.id,
        movieId: movie.id,
        order: (lastItem?.order ?? -1) + 1,
        note: parsed.data.note ?? null,
      },
      include: {
        movie: { select: { id: true, tmdbId: true, title: true, poster: true, releaseDate: true } },
      },
    })

    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'ADDED_TO_LIST',
        movieId: movie.id,
        listId: params.id,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const list = await prisma.list.findUnique({ where: { id: params.id } })
    if (!list || list.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = reorderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    await prisma.$transaction(
      parsed.data.items.map(({ id, order }) =>
        prisma.listItem.update({ where: { id }, data: { order } })
      )
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 })
  }
}

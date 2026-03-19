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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const list = await prisma.list.findUnique({ where: { id } })
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
      where: { listId: id },
      orderBy: { order: 'desc' },
    })

    const item = await prisma.listItem.create({
      data: {
        listId: id,
        movieId: movie.id,
        order: (lastItem?.order ?? -1) + 1,
        note: parsed.data.note ?? null,
      },
      include: {
        movie: { select: { id: true, tmdbId: true, title: true, poster: true, releaseDate: true } },
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    console.error('Add list item error:', err)
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const list = await prisma.list.findUnique({ where: { id } })
    if (!list || list.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = reorderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Verify all items belong to this list
    const itemIds = parsed.data.items.map((i) => i.id)
    const ownedItems = await prisma.listItem.findMany({
      where: { id: { in: itemIds }, listId: id },
      select: { id: true },
    })
    if (ownedItems.length !== itemIds.length) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.$transaction(
      parsed.data.items.map(({ id: itemId, order }) =>
        prisma.listItem.update({ where: { id: itemId }, data: { order } })
      )
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reorder list items error:', err)
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 })
  }
}

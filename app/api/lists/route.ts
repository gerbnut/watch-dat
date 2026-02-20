import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { z } from 'zod'

const createListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  isPublic: z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = createListSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const list = await prisma.list.create({
      data: { userId: session.user.id, ...parsed.data },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        items: { include: { movie: true }, orderBy: { order: 'asc' } },
        _count: { select: { items: true } },
      },
    })

    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'CREATED_LIST',
        listId: list.id,
      },
    })

    return NextResponse.json(list, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const cursor = searchParams.get('cursor')
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  const limit = 30

  try {
    const where: any = { userId: session.user.id }

    if (year) {
      const y = Number(year)
      const m = month ? Number(month) : null
      if (m) {
        where.watchedDate = {
          gte: new Date(`${y}-${String(m).padStart(2, '0')}-01`),
          lt: new Date(m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`),
        }
      } else {
        where.watchedDate = {
          gte: new Date(`${y}-01-01`),
          lt: new Date(`${y + 1}-01-01`),
        }
      }
    }

    const entries = await prisma.diaryEntry.findMany({
      where,
      include: {
        movie: {
          select: {
            id: true,
            tmdbId: true,
            title: true,
            poster: true,
            releaseDate: true,
            genres: true,
            runtime: true,
          },
        },
      },
      orderBy: { watchedDate: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = entries.length > limit
    const data = hasMore ? entries.slice(0, limit) : entries

    return NextResponse.json({
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load diary' }, { status: 500 })
  }
}

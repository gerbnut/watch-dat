export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  const { searchParams } = req.nextUrl
  const cursor = searchParams.get('cursor')
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  const genre = searchParams.get('genre')
  const limit = 30

  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username.toLowerCase() },
      select: { id: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const where: any = { userId: user.id }

    if (year) {
      const y = Number(year)
      where.watchedDate = {
        gte: new Date(`${y}-01-01`),
        lt: new Date(`${y + 1}-01-01`),
      }
      if (month) {
        const m = Number(month)
        where.watchedDate = {
          gte: new Date(`${y}-${String(m).padStart(2, '0')}-01`),
          lt: new Date(m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`),
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

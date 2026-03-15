export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const { searchParams } = req.nextUrl
  const offset = Number(searchParams.get('offset') ?? '0')
  const limit = 30

  try {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Get all rated films deduped by movie, preferring review rating over diary rating
    const films = await prisma.$queryRaw<
      {
        movieId: string
        tmdbId: number
        title: string
        poster: string | null
        releaseDate: Date | null
        rating: number
      }[]
    >`
      SELECT DISTINCT ON (m.id)
        m.id as "movieId",
        m."tmdbId",
        m.title,
        m.poster,
        m."releaseDate",
        COALESCE(r.rating, de.rating) as rating
      FROM "Movie" m
      LEFT JOIN "Review" r ON r."movieId" = m.id AND r."userId" = ${user.id} AND r.rating IS NOT NULL
      LEFT JOIN "DiaryEntry" de ON de."movieId" = m.id AND de."userId" = ${user.id} AND de.rating IS NOT NULL
      WHERE (r.id IS NOT NULL OR de.id IS NOT NULL)
      ORDER BY m.id
    `

    // Sort in JS for proper rating DESC, title ASC ordering
    films.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating
      return a.title.localeCompare(b.title)
    })

    // Compute ranks with ties
    const allRanked = films.map((film, i) => {
      let rank = 1
      for (let j = 0; j < i; j++) {
        if (films[j].rating > film.rating) {
          rank = j + 1
        }
      }
      if (i > 0 && films[i - 1].rating > film.rating) {
        rank = i + 1
      } else if (i > 0 && films[i - 1].rating === film.rating) {
        // Find first film with this rating
        let firstWithRating = i
        while (firstWithRating > 0 && films[firstWithRating - 1].rating === film.rating) {
          firstWithRating--
        }
        rank = firstWithRating + 1
      }
      return { ...film, rank }
    })

    const page = allRanked.slice(offset, offset + limit)
    const hasMore = offset + limit < allRanked.length

    return NextResponse.json({
      data: page,
      nextOffset: hasMore ? offset + limit : null,
      hasMore,
    })
  } catch (err) {
    console.error('Ranked error:', err)
    return NextResponse.json({ error: 'Failed to load ranked films' }, { status: 500 })
  }
}

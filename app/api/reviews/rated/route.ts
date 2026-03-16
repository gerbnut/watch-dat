export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id, rating: { not: null } },
    select: {
      id: true,
      rating: true,
      movie: {
        select: {
          tmdbId: true,
          title: true,
          poster: true,
          releaseDate: true,
        },
      },
    },
    orderBy: { rating: 'desc' },
    take: 200,
  })

  return NextResponse.json(reviews)
}

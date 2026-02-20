import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query = searchParams.get('q') ?? ''

  if (query.trim().length < 1) {
    return NextResponse.json([])
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        _count: { select: { reviews: true, followers: true } },
      },
      take: 10,
    })

    return NextResponse.json(users)
  } catch (err) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

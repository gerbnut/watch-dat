import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { GENRE_MAP } from '@/lib/tmdb'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { genrePreferences: true },
  })

  return NextResponse.json({ genreIds: (user?.genrePreferences as number[]) ?? [] })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { genreIds } = await req.json()
  if (!Array.isArray(genreIds)) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const validIds = genreIds.filter((id: number) => id in GENRE_MAP)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { genrePreferences: validIds },
  })

  return NextResponse.json({ success: true })
}

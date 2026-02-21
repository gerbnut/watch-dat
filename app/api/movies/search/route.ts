export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { searchMovies } from '@/lib/tmdb'
import { rateLimit, getIp } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  const { allowed, headers } = rateLimit({
    key: `ip:${getIp(req)}:movie-search`,
    limit: 60,
    windowSec: 60,
  })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers })
  }

  const { searchParams } = req.nextUrl
  const query = searchParams.get('q')
  const page = Number(searchParams.get('page') ?? '1')

  if (!query || query.trim().length < 1) {
    return NextResponse.json({ results: [], total_pages: 0, total_results: 0 })
  }

  try {
    const results = await searchMovies(query.trim(), page)
    return NextResponse.json(results)
  } catch (err) {
    console.error('Movie search error:', err)
    return NextResponse.json({ error: 'Failed to search movies' }, { status: 500 })
  }
}

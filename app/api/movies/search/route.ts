export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { searchMovies } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
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

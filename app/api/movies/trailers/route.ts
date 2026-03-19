import { NextRequest, NextResponse } from 'next/server'
import { getMovieVideos, pickBestTrailer } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const tmdbIds = req.nextUrl.searchParams.get('tmdbIds')
  if (!tmdbIds) return NextResponse.json({})

  const ids = tmdbIds.split(',').map(Number).filter(Boolean).slice(0, 20)

  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const { results } = await getMovieVideos(id)
        const trailer = pickBestTrailer(results)
        return [id, trailer?.key ?? null] as const
      } catch {
        return [id, null] as const
      }
    })
  )

  return NextResponse.json(Object.fromEntries(results))
}

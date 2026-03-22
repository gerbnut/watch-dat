import { NextResponse } from 'next/server'
import { getNowPlayingMovies, discoverMovies } from '@/lib/tmdb'

export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const monthStart = `${yyyy}-${mm}-01`
  const monthEnd = `${yyyy}-${mm}-${new Date(yyyy, now.getMonth() + 1, 0).getDate()}`
  const today = `${yyyy}-${mm}-${dd}`
  const threeMonthsOut = new Date(now)
  threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3)
  const futureDate = `${threeMonthsOut.getFullYear()}-${String(threeMonthsOut.getMonth() + 1).padStart(2, '0')}-${String(threeMonthsOut.getDate()).padStart(2, '0')}`
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const recentDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`

  const labels = ['nowPlaying', 'openingThisMonth', 'comingSoon', 'freshAction', 'newHorror', 'newDramas']
  const settled = await Promise.allSettled([
    getNowPlayingMovies(),
    discoverMovies({ releaseDateGte: monthStart, releaseDateLte: monthEnd, minVotes: 10 }),
    discoverMovies({ releaseDateGte: today, releaseDateLte: futureDate, minVotes: 0 }),
    discoverMovies({ withGenres: '28,53', releaseDateGte: recentDate, minVotes: 50 }),
    discoverMovies({ withGenres: 27, releaseDateGte: recentDate, minVotes: 50 }),
    discoverMovies({ withGenres: 18, releaseDateGte: recentDate, voteAverageGte: 7.0, minVotes: 100 }),
  ])

  const results = settled.map((r, i) => ({
    call: labels[i],
    status: r.status,
    resultCount: r.status === 'fulfilled' ? r.value?.results?.length ?? 0 : 0,
    error: r.status === 'rejected' ? String(r.reason) : null,
  }))

  return NextResponse.json({
    params: { monthStart, monthEnd, today, futureDate, recentDate },
    env: {
      hasApiKey: !!process.env.TMDB_API_KEY,
      hasAccessToken: !!process.env.TMDB_ACCESS_TOKEN,
    },
    results,
  })
}

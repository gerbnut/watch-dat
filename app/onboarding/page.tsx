import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getTrendingMovies, getPopularMovies, discoverMovies } from '@/lib/tmdb'
import { OnboardingClient } from './OnboardingClient'

export const metadata: Metadata = { title: 'Welcome — Pick your favourites' }

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const genreIds = [28, 35, 18, 27, 10749, 878, 53, 14, 99, 16, 80, 9648]

  const [trending, popular, ...genreResults] = await Promise.all([
    getTrendingMovies('week'),
    getPopularMovies(),
    ...genreIds.map((id) =>
      discoverMovies({ withGenres: id, sortBy: 'vote_average.desc', minVotes: 500 })
        .then((r) => {
          const movie = r.results.find((m) => m.backdrop_path)
          return { genreId: id, backdrop: movie?.backdrop_path ?? null }
        })
        .catch(() => ({ genreId: id, backdrop: null }))
    ),
  ])

  // Deduplicate and take first 32 for the suggestions grid
  const seen = new Set<number>()
  const suggestions: { id: number; title: string; poster_path: string | null; release_date: string }[] = []
  for (const movie of [...(trending.results ?? []), ...(popular.results ?? [])]) {
    if (!seen.has(movie.id) && suggestions.length < 32) {
      seen.add(movie.id)
      suggestions.push(movie)
    }
  }

  const genreBackdrops: Record<number, string | null> = {}
  for (const gr of genreResults) {
    genreBackdrops[gr.genreId] = gr.backdrop
  }

  return <OnboardingClient suggestions={suggestions} genreBackdrops={genreBackdrops} username={session.user.username ?? ''} displayName={session.user.displayName ?? ''} />
}

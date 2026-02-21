import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getTrendingMovies, getPopularMovies } from '@/lib/tmdb'
import { OnboardingClient } from './OnboardingClient'

export const metadata: Metadata = { title: 'Welcome — Pick your favourites' }

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [trending, popular] = await Promise.all([
    getTrendingMovies('week'),
    getPopularMovies(),
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

  return <OnboardingClient suggestions={suggestions} username={session.user.username!} displayName={session.user.displayName ?? ''} />
}

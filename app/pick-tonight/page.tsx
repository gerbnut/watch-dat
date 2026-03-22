import { auth } from '@/auth'
import { Metadata } from 'next'
import { discoverMovies } from '@/lib/tmdb'
import { PickTonightClient } from './PickTonightClient'

export const metadata: Metadata = { title: 'Pick Tonight' }

export default async function PickTonightPage() {
  const session = await auth()

  const genreIds = [28, 35, 18, 27, 10749, 878, 53, 14]
  const genreResults = await Promise.all(
    genreIds.map((id) =>
      discoverMovies({ withGenres: id, sortBy: 'vote_average.desc', minVotes: 500 })
        .then((r) => {
          const movie = r.results.find((m) => m.backdrop_path)
          return { genreId: id, backdrop: movie?.backdrop_path ?? null }
        })
        .catch(() => ({ genreId: id, backdrop: null }))
    )
  )

  const genreBackdrops: Record<number, string | null> = {}
  for (const gr of genreResults) {
    genreBackdrops[gr.genreId] = gr.backdrop
  }

  return <PickTonightClient currentUserId={session?.user?.id ?? null} genreBackdrops={genreBackdrops} />
}
